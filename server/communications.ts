import { Router, Request, Response } from 'express';
import { pool, db } from './db';
import { communications } from '@shared/schema';
import {
  bucketInteractionTime,
  calculateDurationMinutes,
  runNlpTaggingPipeline,
  scoreInteractionSuccess,
} from './services/nlp-tagging';
import { z } from 'zod';
import { supabaseServer } from './lib/supabase';

// Create a router to handle communication-related routes
const router = Router();

// Create new communication/note endpoint
router.post('/api/communications', async (req: Request, res: Response) => {
  try {
    const {
      client_id,
      initiated_by,
      start_time,
      communication_type,
      channel,
      direction,
      subject,
      summary,
      notes,
      sentiment,
      follow_up_required,
      next_steps,
      tags
    } = req.body;

    // Validate required fields
    if (!client_id || !communication_type || !channel || !direction) {
      return res.status(400).json({ 
        error: 'Missing required fields: client_id, communication_type, channel, direction' 
      });
    }

    // Insert new communication record
    const { rows } = await pool.query(`
      INSERT INTO communications (
        client_id, initiated_by, start_time, communication_type, channel, direction,
        subject, summary, notes, sentiment, follow_up_required, next_steps, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
      RETURNING id
    `, [
      client_id, 
      initiated_by || 1, 
      start_time || new Date().toISOString(), 
      communication_type, 
      channel, 
      direction, 
      subject || '', 
      summary || '', 
      notes || '', 
      sentiment || 'neutral', 
      follow_up_required || false, 
      next_steps || '', 
      tags && tags.length > 0 ? `{${tags.join(',')}}` : '{}'
    ]);

    console.log('New communication created with ID:', rows[0]?.id);
    res.status(201).json({ 
      message: 'Communication created successfully',
      id: rows[0]?.id
    });
  } catch (error) {
    console.error('Error creating communication:', error);
    res.status(500).json({ error: 'Failed to create communication' });
  }
});

const interactionsQuerySchema = z.object({
  clientId: z.coerce.number().optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
});

const createInteractionSchema = z.object({
  clientId: z.coerce.number(),
  initiatedBy: z.coerce.number(),
  communicationType: z.string(),
  direction: z.string(),
  channel: z.string().optional(),
  subject: z.string().optional(),
  summary: z.string().optional(),
  notes: z.string().optional(),
  startTime: z.string().or(z.date()),
  endTime: z.string().or(z.date()).optional().nullable(),
  duration: z.number().optional().nullable(),
  status: z.string().optional(),
  followupRequired: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  sentiment: z.string().optional(),
});

type InteractionRow = {
  id: number;
  client_id: number;
  initiated_by: number | null;
  start_time: string;
  end_time: string | null;
  duration: number | null;
  communication_type: string;
  channel: string | null;
  direction: string;
  subject: string | null;
  summary: string | null;
  notes: string | null;
  sentiment: string | null;
  follow_up_required: boolean | null;
  follow_up_date?: string | null;
  tags: string[] | null;
  status: string | null;
};

function parseTags(rawTags: any): string[] {
  if (!rawTags) return [];
  if (Array.isArray(rawTags)) return rawTags.filter(Boolean);
  if (typeof rawTags === 'string') {
    return rawTags
      .replace(/[{}]/g, '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function deriveSummary(rows: InteractionRow[]) {
  const byType: Record<string, number> = {};
  const byChannel: Record<string, number> = {};
  const sentimentCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};
  let durationTotal = 0;
  let durationCount = 0;
  let followUps = 0;

  for (const row of rows) {
    byType[row.communication_type] = (byType[row.communication_type] || 0) + 1;
    const channelKey = row.channel || 'unspecified';
    byChannel[channelKey] = (byChannel[channelKey] || 0) + 1;

    const sentimentKey = row.sentiment || 'neutral';
    sentimentCounts[sentimentKey] = (sentimentCounts[sentimentKey] || 0) + 1;

    const tags = parseTags(row.tags);
    tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });

    if (typeof row.duration === 'number' && !Number.isNaN(row.duration)) {
      durationTotal += row.duration;
      durationCount += 1;
    }

    if (row.follow_up_required) {
      followUps += 1;
    }
  }

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag, count]) => ({ tag, count }));

  return {
    byType,
    byChannel,
    sentiment: sentimentCounts,
    averageDuration: durationCount > 0 ? Math.round((durationTotal / durationCount) * 10) / 10 : null,
    followUps,
    topTags,
  };
}

function recommendMeetingWindow(rows: InteractionRow[]) {
  if (rows.length === 0) return null;

  const buckets = new Map<string, { score: number; count: number; lastInteraction?: string }>();

  for (const row of rows) {
    if (!row.start_time) continue;
    const bucket = bucketInteractionTime(row.start_time);
    const key = `${bucket.day}::${bucket.window}`;
    const duration = typeof row.duration === 'number' ? row.duration : calculateDurationMinutes(row.start_time, row.end_time);
    const score = scoreInteractionSuccess(row.sentiment, duration);
    const current = buckets.get(key) || { score: 0, count: 0 };
    current.score += score;
    current.count += 1;
    if (!current.lastInteraction || new Date(row.start_time) > new Date(current.lastInteraction)) {
      current.lastInteraction = row.start_time;
    }
    buckets.set(key, current);
  }

  if (buckets.size === 0) return null;

  const sorted = Array.from(buckets.entries()).sort((a, b) => b[1].score - a[1].score);
  const [bestKey, bestData] = sorted[0];
  const [day, window] = bestKey.split('::');
  const maxScore = sorted[0][1].score;
  const minScore = sorted[sorted.length - 1][1].score;
  const confidenceRange = maxScore - minScore || 1;
  const confidence = Math.min(1, bestData.score / (maxScore + confidenceRange));

  return {
    day,
    window,
    confidence: Math.round(confidence * 100) / 100,
    supportingInteractions: bestData.count,
    lastSuccessfulInteraction: bestData.lastInteraction || null,
  };
}

router.get('/api/interactions', async (req: Request, res: Response) => {
  try {
    const parsed = interactionsQuerySchema.safeParse({
      clientId: req.query.clientId,
      limit: req.query.limit,
    });

    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid query parameters', details: parsed.error.flatten() });
    }

    const { clientId, limit } = parsed.data;

    const params: any[] = [];
    let whereClause = '';
    if (clientId) {
      params.push(clientId);
      whereClause = `WHERE c.client_id = $${params.length}`;
    }

    params.push(limit);

    const { rows } = await pool.query<InteractionRow>(
      `SELECT c.id, c.client_id, c.initiated_by, c.start_time, c.end_time, c.duration,
              c.communication_type, c.channel, c.direction, c.subject, c.summary,
              c.notes, c.sentiment, c.follow_up_required, c.follow_up_date, c.tags, c.status
         FROM communications c
         ${whereClause}
         ORDER BY c.start_time DESC
         LIMIT $${params.length}`,
      params,
    );

    const summary = deriveSummary(rows);
    const lastInteraction = rows[0] || null;
    const recommendation = recommendMeetingWindow(rows);

    res.json({
      clientId: clientId || null,
      totalInteractions: rows.length,
      interactions: rows.map((row) => ({
        ...row,
        tags: parseTags(row.tags),
      })),
      summary: {
        byType: summary.byType,
        byChannel: summary.byChannel,
        sentiment: summary.sentiment,
        averageDuration: summary.averageDuration,
        followUps: summary.followUps,
      },
      topTags: summary.topTags,
      lastInteraction,
      recommendation,
    });
  } catch (error) {
    console.error('Error fetching interactions summary:', error);
    res.status(500).json({ error: 'Failed to fetch interactions' });
  }
});

router.post('/api/interactions', async (req: Request, res: Response) => {
  try {
    const parsed = createInteractionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid interaction payload', details: parsed.error.flatten() });
    }

    const data = parsed.data;
    const durationMinutes =
      typeof data.duration === 'number' && !Number.isNaN(data.duration)
        ? data.duration
        : calculateDurationMinutes(data.startTime, data.endTime);

    const nlpResult = runNlpTaggingPipeline({
      subject: data.subject,
      summary: data.summary,
      notes: data.notes,
      channel: data.channel,
      durationMinutes,
    });

    const combinedTags = Array.from(new Set([...(data.tags || []), ...nlpResult.tags]));
    const sentiment = data.sentiment || nlpResult.sentiment;

    const { rows } = await pool.query<InteractionRow>(
      `INSERT INTO communications (
        client_id, initiated_by, start_time, end_time, duration,
        communication_type, channel, direction, subject, summary,
        notes, sentiment, tags, follow_up_required, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        data.clientId,
        data.initiatedBy,
        data.startTime,
        data.endTime ?? null,
        durationMinutes,
        data.communicationType,
        data.channel || null,
        data.direction,
        data.subject || '',
        data.summary || '',
        data.notes || null,
        sentiment,
        combinedTags,
        data.followupRequired ?? false,
        data.status || 'completed',
      ],
    );

    const created = rows[0];

    res.status(201).json({
      interaction: {
        ...created,
        tags: parseTags(created.tags),
      },
      nlp: nlpResult,
    });
  } catch (error) {
    console.error('Error creating interaction:', error);
    res.status(500).json({ error: 'Failed to create interaction' });
  }
});

// Get all communications (for global view)
router.get('/api/communications', async (req: Request, res: Response) => {
  try {
    // Query to get all communications with client names and their action items and attachments
    const { rows: communications } = await pool.query(`
      SELECT c.*, 
        cl.full_name as client_name,
        cl.initials as client_initials,
        cl.tier as client_tier,
        (SELECT COUNT(*) FROM communication_action_items cai WHERE cai.communication_id = c.id) as action_item_count,
        (SELECT COUNT(*) FROM communication_attachments ca WHERE ca.communication_id = c.id) as attachment_count
      FROM communications c
      JOIN clients cl ON c.client_id = cl.id
      ORDER BY c.start_time DESC
    `);
    
    res.json(communications);
  } catch (error) {
    console.error('Error fetching all communications:', error);
    res.status(500).json({ error: 'Failed to fetch communications' });
  }
});

// Get all communications for a specific client
router.get('/api/communications/:clientId', async (req: Request, res: Response) => {
  try {
    const clientId = parseInt(req.params.clientId);
    
    if (isNaN(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }
    
    // Query to get communications with their action items and attachments
    const { rows: communications } = await pool.query(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM communication_action_items cai WHERE cai.communication_id = c.id) as action_item_count,
        (SELECT COUNT(*) FROM communication_attachments ca WHERE ca.communication_id = c.id) as attachment_count
      FROM communications c
      WHERE c.client_id = $1
      ORDER BY c.start_time DESC
    `, [clientId]);
    
    res.json(communications);
  } catch (error) {
    console.error('Error fetching communications:', error);
    res.status(500).json({ error: 'Failed to fetch communications' });
  }
});

// Get client communication preferences
router.get('/api/communications/preferences/:clientId', async (req: Request, res: Response) => {
  try {
    const clientId = parseInt(req.params.clientId);
    
    if (isNaN(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }
    
    const { rows } = await pool.query(`
      SELECT * FROM client_communication_preferences
      WHERE client_id = $1
    `, [clientId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Communication preferences not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching communication preferences:', error);
    res.status(500).json({ error: 'Failed to fetch communication preferences' });
  }
});

// Get communication action items
router.get('/api/communications/:communicationId/action-items', async (req: Request, res: Response) => {
  try {
    const communicationId = parseInt(req.params.communicationId);
    
    if (isNaN(communicationId)) {
      return res.status(400).json({ error: 'Invalid communication ID' });
    }
    
    const { rows } = await pool.query(`
      SELECT * FROM communication_action_items
      WHERE communication_id = $1
      ORDER BY due_date ASC
    `, [communicationId]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching communication action items:', error);
    res.status(500).json({ error: 'Failed to fetch communication action items' });
  }
});

// Get communication attachments
router.get('/api/communications/:communicationId/attachments', async (req: Request, res: Response) => {
  try {
    const communicationId = parseInt(req.params.communicationId);
    
    if (isNaN(communicationId)) {
      return res.status(400).json({ error: 'Invalid communication ID' });
    }
    
    const { rows } = await pool.query(`
      SELECT * FROM communication_attachments
      WHERE communication_id = $1
    `, [communicationId]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching communication attachments:', error);
    res.status(500).json({ error: 'Failed to fetch communication attachments' });
  }
});

// Get communication templates
router.get('/api/communication-templates', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM communication_templates
      WHERE is_active = true
      ORDER BY category, name
    `);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching communication templates:', error);
    res.status(500).json({ error: 'Failed to fetch communication templates' });
  }
});

// Get communication templates by category
router.get('/api/communication-templates/category/:category', async (req: Request, res: Response) => {
  try {
    const category = req.params.category;
    
    const { rows } = await pool.query(`
      SELECT * FROM communication_templates
      WHERE category = $1 AND is_active = true
      ORDER BY name
    `, [category]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching communication templates by category:', error);
    res.status(500).json({ error: 'Failed to fetch communication templates' });
  }
});

// Create a new communication
router.post('/api/communications', async (req: Request, res: Response) => {
  try {
    const {
      clientId,
      initiatedBy,
      startTime,
      endTime,
      duration,
      communicationType,
      channel,
      direction,
      subject,
      summary,
      details,
      sentiment,
      tags,
      followupRequired,
      hasAttachments,
      status
    } = req.body;
    
    if (!clientId || !initiatedBy || !startTime || !communicationType || !direction) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Insert using raw SQL to match actual database schema
    const { rows } = await pool.query(`
      INSERT INTO communications (
        client_id, initiated_by, start_time, end_time, duration,
        communication_type, channel, direction, subject, summary,
        notes, sentiment, tags, follow_up_required
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      clientId, initiatedBy, startTime, endTime, duration,
      communicationType, channel, direction, subject || '', summary || '',
      details || null, sentiment || 'neutral', tags || [], followupRequired || false
    ]);
    
    const newCommunication = rows[0];
    
    res.json(newCommunication);
  } catch (error) {
    console.error('Error creating communication:', error);
    res.status(500).json({ error: 'Failed to create communication' });
  }
});

// Update client communication preferences
router.put('/api/communications/preferences/:clientId', async (req: Request, res: Response) => {
  try {
    const clientId = parseInt(req.params.clientId);
    
    if (isNaN(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }
    
    const {
      preferredChannels,
      preferredFrequency,
      preferredDays,
      preferredTimeSlots,
      preferredLanguage,
      optInMarketing,
      doNotContact
    } = req.body;
    
    // Check if preferences exist for this client
    const { rows: existingRows } = await pool.query(
      'SELECT * FROM client_communication_preferences WHERE client_id = $1',
      [clientId]
    );
    
    if (existingRows.length === 0) {
      // Insert new preferences
      const { rows } = await pool.query(`
        INSERT INTO client_communication_preferences
        (client_id, preferred_channels, preferred_frequency, preferred_days, 
         preferred_time_slots, preferred_language, opt_in_marketing, do_not_contact, last_updated)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING *
      `, [
        clientId,
        preferredChannels || [],
        preferredFrequency || 'monthly',
        preferredDays || [],
        preferredTimeSlots || [],
        preferredLanguage || 'English',
        optInMarketing === undefined ? true : optInMarketing,
        doNotContact === undefined ? false : doNotContact
      ]);
      
      return res.json(rows[0]);
    } else {
      // Update existing preferences
      const { rows } = await pool.query(`
        UPDATE client_communication_preferences
        SET 
          preferred_channels = $2,
          preferred_frequency = $3,
          preferred_days = $4,
          preferred_time_slots = $5,
          preferred_language = $6,
          opt_in_marketing = $7,
          do_not_contact = $8,
          last_updated = NOW()
        WHERE client_id = $1
        RETURNING *
      `, [
        clientId,
        preferredChannels || existingRows[0].preferred_channels,
        preferredFrequency || existingRows[0].preferred_frequency,
        preferredDays || existingRows[0].preferred_days,
        preferredTimeSlots || existingRows[0].preferred_time_slots,
        preferredLanguage || existingRows[0].preferred_language,
        optInMarketing === undefined ? existingRows[0].opt_in_marketing : optInMarketing,
        doNotContact === undefined ? existingRows[0].do_not_contact : doNotContact
      ]);
      
      return res.json(rows[0]);
    }
  } catch (error) {
    console.error('Error updating communication preferences:', error);
    res.status(500).json({ error: 'Failed to update communication preferences' });
  }
});

// Create a new action item for a communication
router.post('/api/communications/:communicationId/action-items', async (req: Request, res: Response) => {
  try {
    const communicationId = parseInt(req.params.communicationId);
    
    if (isNaN(communicationId)) {
      return res.status(400).json({ error: 'Invalid communication ID' });
    }
    
    const { title, description, assignedTo, dueDate, priority, status } = req.body;
    
    if (!title || !assignedTo || !dueDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const { rows } = await pool.query(`
      INSERT INTO communication_action_items
      (communication_id, title, description, assigned_to, due_date, priority, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      communicationId,
      title,
      description || null,
      assignedTo,
      dueDate,
      priority || 'medium',
      status || 'pending'
    ]);
    
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating action item:', error);
    res.status(500).json({ error: 'Failed to create action item' });
  }
});

// Update action item status
router.put('/api/action-items/:actionItemId', async (req: Request, res: Response) => {
  try {
    const actionItemId = parseInt(req.params.actionItemId);
    
    if (isNaN(actionItemId)) {
      return res.status(400).json({ error: 'Invalid action item ID' });
    }
    
    const { status, completedAt } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const { rows } = await pool.query(`
      UPDATE communication_action_items
      SET status = $2, completed_at = $3
      WHERE id = $1
      RETURNING *
    `, [
      actionItemId,
      status,
      status === 'completed' ? (completedAt || new Date()) : null
    ]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Action item not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating action item:', error);
    res.status(500).json({ error: 'Failed to update action item' });
  }
});

// Get communication stats for a relationship manager
router.get('/api/communications/stats/rm/:rmId', async (req: Request, res: Response) => {
  try {
    const rmId = parseInt(req.params.rmId);
    
    if (isNaN(rmId)) {
      return res.status(400).json({ error: 'Invalid RM ID' });
    }
    
    // Get communication counts by type
    const { rows: typeCounts } = await pool.query(`
      SELECT communication_type, COUNT(*) as count
      FROM communications
      WHERE initiated_by = $1
      GROUP BY communication_type
    `, [rmId]);
    
    // Get communication counts by channel
    const { rows: channelCounts } = await pool.query(`
      SELECT channel, COUNT(*) as count
      FROM communications
      WHERE initiated_by = $1
      GROUP BY channel
    `, [rmId]);
    
    // Get communication counts by month
    const { rows: monthlyCounts } = await pool.query(`
      SELECT 
        EXTRACT(YEAR FROM start_time) as year,
        EXTRACT(MONTH FROM start_time) as month,
        COUNT(*) as count
      FROM communications
      WHERE initiated_by = $1
      GROUP BY EXTRACT(YEAR FROM start_time), EXTRACT(MONTH FROM start_time)
      ORDER BY year, month
    `, [rmId]);
    
    // Get total action items and pending action items
    const { rows: actionItemStats } = await pool.query(`
      SELECT
        COUNT(*) as total_action_items,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_action_items,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_action_items
      FROM communication_action_items cai
      JOIN communications c ON cai.communication_id = c.id
      WHERE c.initiated_by = $1
    `, [rmId]);
    
    res.json({
      communicationsByType: typeCounts,
      communicationsByChannel: channelCounts,
      communicationsByMonth: monthlyCounts,
      actionItems: actionItemStats.length > 0 ? actionItemStats[0] : {
        total_action_items: 0,
        pending_action_items: 0,
        completed_action_items: 0
      }
    });
  } catch (error) {
    console.error('Error fetching communication stats:', error);
    res.status(500).json({ error: 'Failed to fetch communication stats' });
  }
});

// Get deal closure action items (for Expected Closures dashboard)
router.get('/api/action-items/deal-closures', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseServer
      .from('communication_action_items')
      .select(`
        *,
        communications!inner(client_id, clients(full_name, initials))
      `)
      .eq('action_type', 'deal_closure')
      .eq('status', 'pending')
      .gt('deal_value', 0)
      .order('expected_close_date', { ascending: true })
      .order('deal_value', { ascending: false });
    
    if (error) throw error;
    
    // Transform data to match expected format
    const transformed = (data || []).map((item: any) => ({
      ...item,
      expected_amount: item.deal_value,
      client_id: item.communications?.client_id,
      client_name: item.communications?.clients?.full_name,
      client_initials: item.communications?.clients?.initials
    }));
    
    res.json(transformed);
  } catch (error) {
    console.error('Error fetching deal closure action items:', error);
    res.status(500).json({ error: 'Failed to fetch deal closure action items' });
  }
});

// Export the router
export default router;
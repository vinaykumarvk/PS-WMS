/**
 * Module 1.1: Order Confirmation Service
 * Handles order confirmation data retrieval and processing
 */

import { getOrderById } from './order-service';
import { OrderRecord } from './order-service';
import { supabaseServer } from '../lib/supabase';

export interface OrderConfirmationData extends OrderRecord {
  clientName?: string;
  clientEmail?: string;
  clientAddress?: string;
}

/**
 * Get order confirmation data with client information
 */
export async function getOrderConfirmation(orderId: number, userId?: number): Promise<OrderConfirmationData | null> {
  try {
    const order = await getOrderById(orderId, userId);
    
    if (!order) {
      return null;
    }

    // Fetch client information
    let clientName: string | undefined;
    let clientEmail: string | undefined;
    let clientAddress: string | undefined;

    try {
      const { data: client } = await supabaseServer
        .from('clients')
        .select('full_name, email, home_address, home_city, home_state, home_pincode')
        .eq('id', order.clientId)
        .single();

      if (client) {
        clientName = client.full_name;
        clientEmail = client.email;
        
        // Build address string
        const addressParts = [
          client.home_address,
          client.home_city,
          client.home_state,
          client.home_pincode,
        ].filter(Boolean);
        
        if (addressParts.length > 0) {
          clientAddress = addressParts.join(', ');
        }
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
      // Continue without client data
    }

    return {
      ...order,
      clientName,
      clientEmail,
      clientAddress,
    };
  } catch (error: any) {
    console.error('Get order confirmation error:', error);
    throw new Error(`Failed to get order confirmation: ${error.message}`);
  }
}

/**
 * Get order timeline events
 */
export interface TimelineEvent {
  id: string;
  status: string;
  timestamp: string;
  description: string;
  userId?: number;
  reason?: string;
}

export async function getOrderTimeline(orderId: number): Promise<TimelineEvent[]> {
  try {
    const order = await getOrderById(orderId);
    
    if (!order) {
      return [];
    }

    const events: TimelineEvent[] = [];

    // Submitted event
    events.push({
      id: 'submitted',
      status: 'Submitted',
      timestamp: order.submittedAt,
      description: 'Order was submitted successfully',
    });

    // Authorized event (if exists)
    if (order.authorizedAt) {
      events.push({
        id: 'authorized',
        status: order.status,
        timestamp: order.authorizedAt,
        description: `Order was authorized${order.authorizedBy ? ` by user ${order.authorizedBy}` : ''}`,
        userId: order.authorizedBy,
      });
    }

    // Rejected event (if exists)
    if (order.rejectedAt) {
      events.push({
        id: 'rejected',
        status: 'Rejected',
        timestamp: order.rejectedAt,
        description: order.rejectedReason || 'Order was rejected',
        reason: order.rejectedReason,
      });
    }

    // Current status event
    if (order.status && order.status !== 'Pending' && order.status !== 'Pending Approval') {
      const lastEvent = events[events.length - 1];
      if (lastEvent.status !== order.status) {
        events.push({
          id: 'status-update',
          status: order.status,
          timestamp: order.authorizedAt || order.submittedAt,
          description: `Order status updated to ${order.status}`,
        });
      }
    }

    // Sort by timestamp
    return events.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  } catch (error: any) {
    console.error('Get order timeline error:', error);
    throw new Error(`Failed to get order timeline: ${error.message}`);
  }
}


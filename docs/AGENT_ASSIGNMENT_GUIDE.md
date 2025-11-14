# Agent Assignment Guide - Parallel Development

This guide helps assign agents/developers to modules for optimal parallel development.

---

## Module Assignment Matrix

| Module | Agent | Duration | Dependencies | Can Start | Parallel With |
|--------|-------|----------|--------------|-----------|---------------|
| **F1** | Foundation Agent | 2-3 days | None | Day 1 | F3, F4 |
| **F2** | Foundation Agent | 2-3 days | F1 | Day 2 | F3, F4 |
| **F3** | Foundation Agent | 2-3 days | F1 | Day 1 | F1, F2, F4 |
| **F4** | UI Foundation Agent | 3-4 days | None | Day 1 | F1, F2, F3 |
| **A** | Agent A | 2 weeks | F1-F4 | Week 2 | B, C, D, E |
| **B** | Agent B | 2 weeks | F1-F4 | Week 2 | A, C, D, E |
| **C** | Agent C | 2 weeks | F1-F4 | Week 2 | A, B, D, E |
| **D** | Agent D | 2 weeks | F1-F4 | Week 2 | A, B, C, E |
| **E** | Agent E | 2 weeks | F1-F4 | Week 2 | A, B, C, D |
| **I1** | Integration Agent | 1 week | A-E | Week 5 | I3 |
| **I2** | QA Agent | 1 week | I1 | Week 5 | I3 |
| **I3** | Performance Agent | 1 week | I1 | Week 5 | I2 |

---

## Recommended Agent Assignments

### Scenario 1: 5 Agents Available

**Week 1: Foundation**
- **Agent 1 (Foundation):** F1, F2, F3
- **Agent 2 (UI Foundation):** F4
- **Agent 3:** Review & prepare for Module A
- **Agent 4:** Review & prepare for Module B
- **Agent 5:** Review & prepare for Module C

**Weeks 2-4: Core Modules**
- **Agent 1:** Module A (Quick Order)
- **Agent 2:** Module B (Portfolio-Aware)
- **Agent 3:** Module C (SIP Builder)
- **Agent 4:** Module D (Switch Features)
- **Agent 5:** Module E (Redemption Features)

**Week 5: Integration**
- **Agent 1:** Module Integration (I1)
- **Agent 2:** E2E Testing (I2)
- **Agent 3:** Performance Optimization (I3)
- **Agent 4:** Bug fixes & polish
- **Agent 5:** Documentation

---

### Scenario 2: 3 Agents Available

**Week 1: Foundation**
- **Agent 1:** F1, F2, F3
- **Agent 2:** F4
- **Agent 3:** Review & prepare

**Weeks 2-4: Core Modules (Prioritized)**
- **Agent 1:** Module A (Quick Order) → Module B (Portfolio-Aware)
- **Agent 2:** Module C (SIP Builder) → Module D (Switch Features)
- **Agent 3:** Module E (Redemption Features) → Support others

**Week 5: Integration**
- **Agent 1:** Module Integration (I1)
- **Agent 2:** E2E Testing (I2)
- **Agent 3:** Performance Optimization (I3)

---

### Scenario 3: 2 Agents Available

**Week 1: Foundation**
- **Agent 1:** F1, F2, F3
- **Agent 2:** F4

**Weeks 2-4: Core Modules (Sequential)**
- **Agent 1:** Module A → Module C → Module E
- **Agent 2:** Module B → Module D → Support

**Week 5: Integration**
- **Agent 1:** Module Integration (I1)
- **Agent 2:** Testing & Performance (I2, I3)

---

## Agent Skill Requirements

### Foundation Agent (F1-F3)
**Skills Required:**
- TypeScript expertise
- API design experience
- Schema validation (Zod)
- Strong understanding of type systems

**Responsibilities:**
- Create type definitions
- Design API contracts
- Build shared utilities
- Ensure type safety across modules

---

### UI Foundation Agent (F4)
**Skills Required:**
- React expertise
- UI/UX design
- Design systems
- Accessibility knowledge

**Responsibilities:**
- Create reusable components
- Establish design patterns
- Ensure accessibility
- Create component library

---

### Agent A (Quick Order)
**Skills Required:**
- React development
- State management
- API integration
- User experience focus

**Responsibilities:**
- Quick order placement features
- Favorites management
- Recent orders
- Amount presets

---

### Agent B (Portfolio-Aware)
**Skills Required:**
- React development
- Data visualization (charts)
- Complex calculations
- Portfolio management knowledge

**Responsibilities:**
- Portfolio impact preview
- Allocation analysis
- Rebalancing suggestions
- Holdings integration

---

### Agent C (SIP Builder)
**Skills Required:**
- React development
- Form handling
- Financial calculations
- Wizard/stepper patterns

**Responsibilities:**
- SIP builder wizard
- SIP calculator
- SIP calendar
- SIP management

---

### Agent D (Switch Features)
**Skills Required:**
- React development
- Tax calculations
- Complex workflows
- Multi-step forms

**Responsibilities:**
- Switch calculator
- Partial switch
- Multi-scheme switch
- Switch recommendations

---

### Agent E (Redemption Features)
**Skills Required:**
- React development
- Payment integration
- Real-time updates
- Transaction handling

**Responsibilities:**
- Instant redemption
- Redemption calculator
- Redemption history
- Quick redemption

---

### Integration Agent (I1)
**Skills Required:**
- Full-stack development
- System architecture
- Module integration
- Conflict resolution

**Responsibilities:**
- Integrate all modules
- Resolve conflicts
- Ensure consistency
- Update main flow

---

### QA Agent (I2)
**Skills Required:**
- Testing expertise
- E2E testing
- Test automation
- Quality assurance

**Responsibilities:**
- Create test scenarios
- Execute E2E tests
- Performance testing
- Accessibility testing

---

### Performance Agent (I3)
**Skills Required:**
- Performance optimization
- Code splitting
- Caching strategies
- Monitoring setup

**Responsibilities:**
- Optimize bundle size
- Implement caching
- Set up monitoring
- Performance benchmarks

---

## Daily Standup Template

### For Each Agent

**Yesterday:**
- Completed: [List completed tasks]
- Blockers: [Any blockers]

**Today:**
- Working on: [Current tasks]
- Need from others: [Dependencies]

**This Week:**
- Target: [Module/feature]
- On track: [Yes/No]
- Risks: [Any risks]

---

## Communication Channels

### Module-Specific Channels
- `#module-a-quick-order` - Agent A
- `#module-b-portfolio` - Agent B
- `#module-c-sip` - Agent C
- `#module-d-switch` - Agent D
- `#module-e-redemption` - Agent E

### Shared Channels
- `#foundation` - Foundation modules (F1-F4)
- `#integration` - Integration discussions
- `#blockers` - Blockers and dependencies
- `#code-review` - Code review requests

---

## Conflict Resolution Process

1. **Identify Conflict**
   - Document the conflict
   - Identify affected modules
   - Assess impact

2. **Escalate**
   - Post in `#blockers` channel
   - Tag relevant agents
   - Provide context

3. **Resolve**
   - Discuss in sync meeting
   - Make decision
   - Update contracts if needed
   - Communicate resolution

4. **Document**
   - Update contracts
   - Update documentation
   - Share resolution

---

## Handoff Checklist

### When Module is Complete

**Developer Checklist:**
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Documentation complete
- [ ] Integration points documented
- [ ] Known issues documented
- [ ] Branch ready for merge

**Integration Checklist:**
- [ ] Module reviewed
- [ ] Integration tested
- [ ] Conflicts resolved
- [ ] Performance acceptable
- [ ] Ready for production

---

## Success Criteria

### Module Completion
- ✅ All acceptance criteria met
- ✅ Tests passing (>90% coverage)
- ✅ Code reviewed and approved
- ✅ Documentation complete
- ✅ No blocking issues

### Integration Success
- ✅ All modules integrated
- ✅ E2E tests passing
- ✅ Performance benchmarks met
- ✅ No critical bugs
- ✅ Ready for release

---

**Last Updated:** January 2025  
**Owner:** Development Team Lead


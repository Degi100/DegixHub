import { generateId } from 'lucia';
import { db } from '../db';
import { activityLogs } from '../db/schema';

type ActivityAction = 'created' | 'updated' | 'deleted' | 'viewed' | 'copied';
type ResourceType = 'credential' | 'link' | 'tag';

interface LogActivityParams {
  userId: string;
  action: ActivityAction;
  resourceType: ResourceType;
  resourceId?: string;
  resourceName: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, any>;
}

export async function logActivity(params: LogActivityParams) {
  await db.insert(activityLogs).values({
    id: generateId(15),
    userId: params.userId,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId || null,
    resourceName: params.resourceName,
    oldValue: params.oldValue || null,
    newValue: params.newValue || null,
    metadata: params.metadata ? JSON.stringify(params.metadata) : null,
  });
}

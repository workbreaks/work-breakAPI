export interface OnBreak {
  userId: string;
  name: string;
  email: string;
  type: string;
  reason: string;
  createdDate: Date | string; // Using Date type for proper handling
  startTime: string;
}

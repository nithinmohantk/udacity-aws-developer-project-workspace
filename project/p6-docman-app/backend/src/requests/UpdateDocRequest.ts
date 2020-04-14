/**
 * Fields in a request to update a single Doc item.
 */
export interface UpdateDocRequest {
  name: string
  dueDate: string
  done: boolean
}
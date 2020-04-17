/**
 * Fields in a request to update a single Doc item.
 */
export interface UpdateAttachmentRequest {
  type?: string,
  status?: string,
  attachmentUrl:string,
  done: boolean
}
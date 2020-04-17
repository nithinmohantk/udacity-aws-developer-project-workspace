/**
 * Fields in a request to update a single Doc item.
 */
export interface UpdateDocRequest {
  name: string
  version?: string,
  type?: string,
  status?: string,
  attachmentUrl?:string,
  done: boolean
}
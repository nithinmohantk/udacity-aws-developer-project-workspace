/**
 * Fields in a request to create a single Doc item.
 */
export interface CreateDocRequest {
  name: string
  version?: string,
  type?: string,
  status?: string,
}

export interface DocItem {
  userId: string
  docId: string
  createdAt: string
  updatedAt: string
  name: string
  type?: string
  status: string, //Draft, first version, 
  version: string,
  attachmentUrl?: string,
  done?: boolean
}

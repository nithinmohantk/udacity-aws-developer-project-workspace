import * as React from 'react'
import { Form, Button } from 'semantic-ui-react'
import Auth from '../auth/Auth'
import { getUploadUrl, uploadFile, updateAttachmentCompletion } from '../api/docs-api'
import { UploadFileInfo } from '../types/UploadFileInfo'

enum UploadState {
  NoUpload,
  FetchingPresignedUrl,
  UploadingFile,
  UploadingComplete,
  UpdateAttachmentCompletion
}

interface EditDocProps {
  match: {
    params: {
      docId: string
    }
  }
  auth: Auth
}

interface EditDocState {
  file: any
  uploadState: UploadState
}

export class EditDoc extends React.PureComponent<
  EditDocProps,
  EditDocState
  > {
  state: EditDocState = {
    file: undefined,
    uploadState: UploadState.NoUpload
  }

  handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    this.setState({
      file: files[0]
    })
  }

  getFileExtension(filename:string)
  {
    var ext = /^.+\.([^.]+)$/.exec(filename);
    return ext == null ? "" : ext[1];
  }

  getFileInfo(item: any) {
   
    const fileInfo:UploadFileInfo  = {
      name: item.name,
      extn: this.getFileExtension(item.name),
      type: item.type,
      mimetype: item.type,
      size: item.size
    }; 
    try {
      if (!this.state.file) {
        alert('File should be selected')
        return
      }

      // alert('File was uploaded successfully!')
    } catch (e) {
      alert('Could not read file: ' + e.message)
    } finally {
      
      
    }
    return fileInfo;
  }

  handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault()

    try {
      if (!this.state.file) {
        alert('File should be selected')
        return
      }
      console.log(`Selected File ${this.state.file}`);
      this.setUploadState(UploadState.FetchingPresignedUrl)
      const fileInfo:UploadFileInfo = await this.getFileInfo(this.state.file) as UploadFileInfo;
      const uploadUrl = await getUploadUrl(this.props.auth.getIdToken(), this.props.match.params.docId,fileInfo)

      this.setUploadState(UploadState.UploadingFile)
      await uploadFile(uploadUrl, this.state.file)
        .then(() => {
          this.setUploadState(UploadState.UpdateAttachmentCompletion);
        });
      await updateAttachmentCompletion(this.props.auth.getIdToken(), this.props.match.params.docId,fileInfo)
        .then(() => {
          this.setUploadState(UploadState.UploadingComplete);
        });

      alert('File was uploaded successfully!')
    } catch (e) {
      alert('Could not upload a file: ' + e.message)
    } finally {
      this.setUploadState(UploadState.NoUpload)
    }
  }

  
  /**
   *
   *
   * @param {UploadState} uploadState
   * @memberof EditDoc
   */
  setUploadState(uploadState: UploadState) {
    this.setState({
      uploadState
    })
  }

  render() {
    return (
      <div>
        <h1>Upload new document</h1>

        <Form onSubmit={this.handleSubmit}>
          <Form.Field>
            <label>File</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.pub,.pubx,.pptx,.ppt"
              placeholder="Document to upload"
              onChange={this.handleFileChange}
            />
          </Form.Field>

          {this.renderButton()}
        </Form>
      </div>
    )
  }

  renderButton() {

    return (
      <div>
        {this.state.uploadState === UploadState.FetchingPresignedUrl && <p>Uploading image metadata</p>}
        {this.state.uploadState === UploadState.UploadingFile && <p>Uploading file</p>}
        {this.state.uploadState === UploadState.UpdateAttachmentCompletion && <p>Uploading document status</p>}
        {this.state.uploadState === UploadState.UploadingComplete && <p>Uploading complete!</p>}
        <Button
          loading={this.state.uploadState !== UploadState.NoUpload}
          type="submit"
        >
          Upload
        </Button>
      </div>
    )
  }
}

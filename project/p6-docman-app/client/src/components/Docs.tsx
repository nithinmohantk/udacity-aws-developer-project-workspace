import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader
} from 'semantic-ui-react'

import { createDoc, deleteDoc, getDocs, patchDoc } from '../api/docs-api'
import Auth from '../auth/Auth'
import { Doc } from '../types/Doc'

interface DocsProps {
  auth: Auth
  history: History
}

interface DocsState {
  Docs: Doc[]
  newDocName: string
  loadingDocs: boolean
}

export class Docs extends React.PureComponent<DocsProps, DocsState> {
  state: DocsState = {
    Docs: [],
    newDocName: '',
    loadingDocs: true
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newDocName: event.target.value })
  }

  onEditButtonClick = (docId: string) => {
    this.props.history.push(`/Docs/${docId}/edit`)
  }

  onViewButtonClick = (docId: string, attachmentUrl?: string) => {
    //this.props.history.push(`/Docs/${docId}/edit`)

    if(attachmentUrl)
      window.open(attachmentUrl, "_blank");
    else 
       alert('No attachment found. Please upload first')
  }

  onDocCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
   
    if(this.state.newDocName)
    {
    try {
      const newDoc = await createDoc(this.props.auth.getIdToken(), {
        name: this.state.newDocName,
        version: "1.0.0" //TODO-fix this
      })
      this.setState({
        Docs: [...this.state.Docs, newDoc],
        newDocName: ''
      })
    } catch {
      alert('Doc creation failed')
    }
   }
   else 
   {
    alert('Please enter doc name first')
   }
  }

  onDocDelete = async (docId: string) => {
    try {
      await deleteDoc(this.props.auth.getIdToken(), docId)
      this.setState({
        Docs: this.state.Docs.filter(Doc => Doc.docId != docId)
      })
    } catch {
      alert('Doc deletion failed')
    }
  }

  onDocCheck = async (pos: number) => {
    try {
      const Doc = this.state.Docs[pos]
      await patchDoc(this.props.auth.getIdToken(), Doc.docId, {
        name: Doc.name,
        version: Doc.version,
        done: !Doc.done
      })
      this.setState({
        Docs: update(this.state.Docs, {
          [pos]: { done: { $set: !Doc.done } }
        })
      })
    } catch {
      alert('Doc deletion failed')
    }
  }

  async componentDidMount() {
    try {
      const Docs = await getDocs(this.props.auth.getIdToken())
      this.setState({
        Docs,
        loadingDocs: false
      })
    } catch (e) {
      alert(`Failed to fetch Docs: ${e.message}`)
    }
  }

  render() {
    return (
      <div>
        <Header as="h1">Document Manager</Header>

        {this.renderCreateDocInput()}

        {this.renderDocs()}
      </div>
    )
  }

  renderCreateDocInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'teal',
              labelPosition: 'left',
              icon: 'add',
              content: 'New Doc',
              onClick: this.onDocCreate
            }}
            fluid
            actionPosition="left"
            placeholder="Enter new document name"
            onChange={this.handleNameChange}
          />
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
    )
  }
/**
 *
 *
 * @returns
 * @memberof Docs
 */
renderDocs() {
    if (this.state.loadingDocs) {
      return this.renderLoading()
    }

    return this.renderDocsList()
  }
/**
 *
 *
 * @returns
 * @memberof Docs
 */
renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading Docs
        </Loader>
      </Grid.Row>
    )
  }
/**
 *
 *
 * @returns
 * @memberof Docs
 */
renderDocsList() {
    return (
      <Grid padded>
        {this.state.Docs.map((Doc, pos) => {
          return (
            <Grid.Row key={Doc.docId}>
              <Grid.Column width={1} verticalAlign="middle">
                <Checkbox
                  onChange={() => this.onDocCheck(pos)}
                  checked={Doc.status =="final"}
                />
              </Grid.Column>
              <Grid.Column width={5} verticalAlign="middle" floated="left">
                {Doc.name}
              </Grid.Column>
              <Grid.Column width={2} floated="right">
                {Doc.version}
              </Grid.Column>
              <Grid.Column width={2} floated="right">
                {Doc.type}
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="blue"
                  onClick={() => this.onEditButtonClick(Doc.docId)}
                >
                  <Icon name="pencil" />
                </Button>
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="red"
                  onClick={() => this.onDocDelete(Doc.docId)}
                >
                  <Icon name="delete" />
                </Button>
              </Grid.Column>
              <Grid.Column width={1} floated="right">
      
                <Button
                  icon
                  color="green"
                  disabled= {Doc.attachmentUrl? false:true}
                  onClick={() => this.onViewButtonClick(Doc.docId, Doc.attachmentUrl)}
                >
                  <Icon name="download" />
                </Button>
              </Grid.Column>
              {/* {Doc.attachmentUrl && (
                <a href={Doc.attachmentUrl}  target="_blank" title={Doc.name}>View</a>
              )} */}
              <Grid.Column width={16}>
                <Divider />
              </Grid.Column>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }


}

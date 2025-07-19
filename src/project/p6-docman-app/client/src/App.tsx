import React, { Component } from 'react'
import { Link, Route, Router, Switch } from 'react-router-dom'
import { Grid, Menu, Segment } from 'semantic-ui-react'

import Auth from './auth/Auth'
import { EditDoc } from './components/EditDoc'
import { LogIn } from './components/LogIn'
import { NotFound } from './components/NotFound'
import { Docs } from './components/Docs'
import "./App.scss"
export interface AppProps {}

export interface AppProps {
  auth: Auth
  history: any
}

export interface AppState {}

export default class App extends Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props)
    this.handleLogin = this.handleLogin.bind(this)
    this.handleLogout = this.handleLogout.bind(this)
  }

  handleLogin() {
    this.props.auth.login()
  }

  handleLogout() {
    this.props.auth.logout()
  }

  render() {
    return (
      <div className="App section">
       
        <Segment style={{ padding: '1em 0em' }} vertical>
          <Grid container stackable verticalAlign="middle">
          <Grid.Row>
              <Grid.Column width={16}>
              <div className="app-header"><h1>Doc Man</h1></div>
              </Grid.Column>
          </Grid.Row>
            <Grid.Row>
              <Grid.Column width={16}>
                <Router history={this.props.history}>
                  {this.generateMenu()}

                 <div className="app-content">
                  {this.generateCurrentPage()}
                  </div>
                </Router>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row>
              <Grid.Column width={16}>
              <div className="app-footer">©2020, Imaginary Technologies Corportation</div>
              </Grid.Column>
          </Grid.Row>
          </Grid>
        </Segment>
      </div>
    )
  }

  generateMenu() {
    return (
      <Menu>
        <Menu.Item name="home">
          <Link to="/">Home</Link>
        </Menu.Item>
        <Menu.Item name="docs">
          <Link to="/">Docs</Link>
        </Menu.Item>

        <Menu.Menu position="right">{this.logInLogOutButton()}</Menu.Menu>
      </Menu>
    )
  }

  logInLogOutButton() {
    if (this.props.auth.isAuthenticated()) {
      return (
        <Menu.Item name="logout" onClick={this.handleLogout}>
          Log Out
        </Menu.Item>
      )
    } else {
      return (
        <Menu.Item name="login" onClick={this.handleLogin}>
          Log In
        </Menu.Item>
      )
    }
  }

  generateCurrentPage() {
    if (!this.props.auth.isAuthenticated()) {
      return <LogIn auth={this.props.auth} />
    }

    return (
      <Switch>
        <Route
          path="/"
          exact
          render={props => {
            return <Docs {...props} auth={this.props.auth} />
          }}
        />

        <Route
          path="/Docs/:docId/edit"
          exact
          render={props => {
            return <EditDoc {...props} auth={this.props.auth} />
          }}
        />

        <Route component={NotFound} />
      </Switch>
    )
  }
}

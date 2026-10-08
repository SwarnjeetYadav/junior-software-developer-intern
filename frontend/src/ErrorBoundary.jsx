import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  handleReset = () => {
    localStorage.removeItem('teamflow_token')
    localStorage.removeItem('teamflow_user')
    localStorage.removeItem('teamflow_demo')
    window.history.replaceState({}, '', '/')
    window.location.reload()
  }

  render() {
    if (this.state.error) {
      return (
        <div className="runtime-error-screen">
          <div className="runtime-error-card">
            <span className="brand-mark">AN</span>
            <h1>Anvaya couldn't load this page</h1>
            <p>A UI error occurred. Your saved session can be cleared and the app restarted safely.</p>
            <button type="button" className="primary-button primary-button-dark" onClick={this.handleReset}>
              Return to sign in
            </button>
            {import.meta.env.DEV ? <pre>{this.state.error.message}</pre> : null}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

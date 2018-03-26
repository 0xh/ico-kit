import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import originService from '../services/origin-service'
import contractService from '../services/contract-service'

import ListingDetail from './listing-detail'
import Form from 'react-jsonschema-form'
import Overlay from './overlay'

class ListingCreate extends Component {

  constructor(props) {
    super(props)

    // This is non-ideal fix until IPFS can correctly return 443 errors
    // Server limit is 2MB, withg 100K safety buffer
    this.MAX_UPLOAD_BYTES = (2e6 - 1e5)

    // Enum of our states
    this.STEP = {
      PICK_SCHEMA: 1,
      DETAILS: 2,
      PREVIEW: 3,
      METAMASK: 4,
      PROCESSING: 5,
      SUCCESS: 6
    }

    this.schemaList = [
      {type: 'investment', name: 'Lock up Ether for an amount of time', 'img': 'announcements.jpg'},
    ]

    this.state = {
      step: this.STEP.PICK_SCHEMA,
      selectedSchemaType: this.schemaList[0],
      selectedSchema: null,
      schemaFetched: false,
      formListing: {formData: null}
    }

    this.handleSchemaSelection = this.handleSchemaSelection.bind(this)
    this.onDetailsEntered = this.onDetailsEntered.bind(this)
  }

  handleSchemaSelection() {
    fetch(`/schemas/${this.state.selectedSchemaType}.json`)
    .then((response) => response.json())
    .then((schemaJson) => {
      this.setState({
        selectedSchema: schemaJson,
        schemaFetched: true,
        step: this.STEP.DETAILS
      })
    })
  }

  onDetailsEntered(formListing) {
    this.setState({
      formListing: formListing,
      step: this.STEP.PREVIEW
    })
  }

  onSubmitListing(formListing, selectedSchemaType) {
    this.setState({ step: this.STEP.METAMASK })
    contractService.submitInvestment(formListing, selectedSchemaType)
    .then((tx) => {
      this.setState({ step: this.STEP.PROCESSING })
      // Submitted to blockchain, now wait for confirmation

      console.log("tx", tx);
      contractService.waitTransactionFinished(tx.tx)
      .then((blockNumber) => {
        this.setState({ step: this.STEP.SUCCESS })
        // TODO: Where do we take them after successful creation?
      })
      .catch((error) => {
        console.error(error)
        alert(error)
        // TODO: Reset form? Do something.
      })
    })
    .catch((error) => {
      console.error(error)
      alert(error)
      // TODO: Reset form? Do something.
    })
  }

  render() {
    window.scrollTo(0, 0)
    return (
      <div className="container listing-form">
        { this.state.step === this.STEP.PICK_SCHEMA &&
          <div className="step-container pick-schema">
            <div className="row flex-sm-row-reverse">
             <div className="col-md-5 offset-md-2">
                <div className="info-box">
                  <h2>Choose an Investment Plan</h2>
                  <div className="info-box-image"><img className="d-none d-md-block" src="/images/features-graphic.svg" role="presentation" /></div>
                </div>
              </div>

              <div className="col-md-5">
                <label>STEP {Number(this.state.step)}</label>
                <h2>What type of listing do you want to create?</h2>
                <div className="schema-options">
                  {this.schemaList.map(schema => (
                    <div
                      className={
                        this.state.selectedSchemaType === schema.type ?
                        'schema-selection selected' : 'schema-selection'
                      }
                      key={schema.type}
                      onClick={() => this.setState({selectedSchemaType:schema.type})}
                    >
                      {schema.name}
                    </div>
                  ))}
                </div>
                <div className="btn-container">
                  <button className="float-right btn btn-primary" onClick={() => this.handleSchemaSelection()}>
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        }
        { this.state.step === this.STEP.DETAILS &&
          <div className="step-container schema-details">
            <div className="row flex-sm-row-reverse">
               <div className="col-md-5 offset-md-2">
                  <div className="info-box">
                    <div><h2>How it works</h2>Origin uses a Mozilla project called <a target="_blank" href="http://json-schema.org/" target="_blank">JSONSchema</a> to validate your listing according to standard rules. This standardization is key to allowing unaffiliated entities to read and write to the same data layer.<br/><br/>Be sure to give your listing an appropriate title and description that will inform others as to what you’re offering.<br/><br/><a href={`/schemas/${this.state.selectedSchemaType}.json`} target="_blank">View the <code>{this.state.selectedSchema.name}</code> schema</a></div>
                    <div className="info-box-image"><img className="d-none d-md-block" src="/images/features-graphic.svg" role="presentation" /></div>
                  </div>
                </div>
              <div className="col-md-5">
                <label>STEP {Number(this.state.step)}</label>
                <h2>Create your listing</h2>
                <Form
                  schema={this.state.selectedSchema}
                  onSubmit={this.onDetailsEntered}
                  formData={this.state.formListing.formData}
                  onError={(errors) => console.log(`react-jsonschema-form errors: ${errors.length}`)}
                >
                  <div className="btn-container">
                    <button className="btn btn-other" onClick={() => this.setState({step: this.STEP.PICK_SCHEMA})}>
                      Back
                    </button>
                    <button type="submit" className="float-right btn btn-primary">Continue</button>
                  </div>
                </Form>

              </div>
              <div className="col-md-6">
              </div>
            </div>
          </div>
        }
        { (this.state.step >= this.STEP.PREVIEW) &&
          <div className="step-container listing-preview">
            {this.state.step === this.STEP.METAMASK &&
              <Overlay imageUrl="/images/spinner-animation.svg">
                Confirm transaction<br />
                Press &ldquo;Submit&rdquo; in MetaMask window
              </Overlay>
            }
            {this.state.step === this.STEP.PROCESSING &&
              <Overlay imageUrl="/images/spinner-animation.svg">
                Uploading your listing<br />
                Please stand by...
              </Overlay>
            }
            {this.state.step === this.STEP.SUCCESS &&
              <Overlay imageUrl="/images/circular-check-button.svg">
                Success<br />
                <Link to="/">See your investment</Link>
              </Overlay>
            }
            <div className="row">
              <div className="col-md-7">
                <label className="create-step">STEP {Number(this.state.step)}</label>
                <h2>Preview your investment</h2>
              </div>
            </div>
            <div className="row flex-sm-row-reverse">
              <div className="col-md-5">
                <div className="info-box">
                  <div>
                    <h2>What happens next?</h2>
                    When you hit submit,
                    your transaction representing your invetment will be published to <a target="_blank" href="https://ipfs.io">Ethereum network</a>
                    <br/><br/>Please review your investment before submitting. Your investment will NOT appear to others.
                  </div>
                </div>
              </div>
              <div className="col-md-7">
                <div className="preview">
                  {/*<ListingDetail listingJson={this.state.formListing.formData} />*/}
                </div>
                <div className="btn-container">
                  <button className="btn btn-other float-left" onClick={() => this.setState({step: this.STEP.DETAILS})}>
                    Back
                  </button>
                  <button className="btn btn-primary float-right"
                    onClick={() => this.onSubmitListing(this.state.formListing, this.state.selectedSchemaType)}>
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    )
  }
}

export default ListingCreate

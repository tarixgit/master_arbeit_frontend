import React, { useContext, useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Container from '@material-ui/core/Container'
import Button from '@material-ui/core/Button'

import { gql } from 'apollo-boost'
import { useMutation, useQuery } from '@apollo/react-hooks'

import { SnackbarContext } from '../App'

import { get } from 'lodash'
import Grid from '@material-ui/core/Grid'
import TextField from '@material-ui/core/TextField'
import Divider from '@material-ui/core/Divider'
import Typography from '@material-ui/core/Typography'

const IMPORT_FROM_BLOCKCHAIN = gql`
  mutation UpdateDataFromBlockchain {
    updateDataFromBlockchain {
      success
      message
    }
  }
`
const IMPORT_LABEL = gql`
  mutation ImportLabels($type: Int!) {
    importLabelFromEther(type: $type) {
      success
      message
    }
  }
`
const UPDATE_LABEL = gql`
  mutation UpdateLabels($from: Int!, $to: Int!) {
    updateLabelsOnAddress(from: $from, to: $to) {
      success
      message
    }
  }
`
const UPDATE_STATE = gql`
  query GetUpdateState {
    getUpdateState {
      lastAddress
      lastBlock
      lastTransaction
    }
  }
`

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
  },
  stepperHeader: {
    display: 'flex',
    alignItems: 'center',
  },
  appBarSpacer: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    height: '100vh',
    overflow: 'auto',
    // overflowY: 'visible', // scroll to visible for tests
  },
  instructions: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  container: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
  nextButton: {
    display: 'flex',
    flexDirection: 'row-reverse',
  },
}))

const Settings = (callback, deps) => {
  const classes = useStyles()
  const { setSnackbarMessage } = useContext(SnackbarContext)
  const [updateForm, setUpdateForm] = useState({ from: 60000000, to: 0 })
  const { data, called, statsLoading } = useQuery(UPDATE_STATE, {
    cachePolicy: 'no-cache',
  })
  const [buildFeatures, { loading }] = useMutation(IMPORT_FROM_BLOCKCHAIN, {
    cachePolicy: 'no-cache',
    ignoreResults: true,
    onCompleted: data => {
      const response = get(data, 'updateDataFromBlockchain', {
        success: null,
        message: null,
      })
      if (!response.message) {
        return
      }
      setSnackbarMessage(response)
    },
  })
  const [importLabel] = useMutation(IMPORT_LABEL, {
    cachePolicy: 'no-cache',
    ignoreResults: true,
    onCompleted: data => {
      const response = get(data, 'importLabelFromEther', {
        success: null,
        message: null,
      })
      if (!response.message) {
        return
      }
      setSnackbarMessage(response)
    },
  })
  const [updateLabel] = useMutation(UPDATE_LABEL, {
    cachePolicy: 'no-cache',
    ignoreResults: true,
    onCompleted: data => {
      const response = get(data, 'updateLabelsOnAddress', {
        success: null,
        message: null,
      })
      if (!response.message) {
        return
      }
      setSnackbarMessage(response)
    },
  })

  const changeForm = (e, field) => {
    setUpdateForm({ ...updateForm, [field]: e.target.value })
  }
  let stats
  if (called && !statsLoading) {
    stats = get(data, 'getUpdateState', {
      lastAddress: 0,
      lastBlock: 0,
      lastTransaction: 0,
    })
  }
  return (
    <main className={classes.content}>
      <div className={classes.appBarSpacer} />
      <Container maxWidth="xl" className={classes.container}>
        <Grid container direction="row" justify="flex-start" spacing={2}>
          <Grid item xs={12}>
            <Grid container>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  Last block: {stats.lastBlock}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  Last address id: {stats.lastAddress}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  Last transaction id: {stats.lastTransaction}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom>
                  Please remember the last address id. You will need this for
                  updating the labels later.
                </Typography>
              </Grid>
              <Grid item xs={12} style={{ marginTop: '8px' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={buildFeatures}
                >
                  Update database from blockchain
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <Divider style={{ margin: '18px' }} />
        <Grid item xs={12}>
          <Grid container>
            <Grid item xs={2}>
              <TextField
                id="address-input"
                label="From address:"
                helperText="please the last not updated with label address"
                style={{ marginLeft: 1, paddingRight: 1 }}
                autoFocus
                value={updateForm.from}
                onChange={e => changeForm(e, 'from')}
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                id="address-input"
                label="To address:"
                helperText="0 means last address in database"
                style={{ marginLeft: 1, paddingRight: 1 }}
                autoFocus
                value={updateForm.to}
                onChange={e => changeForm(e, 'to')}
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} style={{ marginTop: '8px' }}>
          <Grid
            container
            direction="row"
            justify="flex-start"
            alignItems="flex-start"
          >
            <Grid item xs={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => updateLabel({ variables: { ...updateForm } })}
              >
                Update Labels
              </Button>
            </Grid>
            <Grid item xs={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => importLabel({ variables: { type: 7 } })}
              >
                Import ERC20 addresses
              </Button>
            </Grid>
            <Grid item xs={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => importLabel({ variables: { type: 8 } })}
              >
                Import ERC721 addresses
              </Button>
            </Grid>
            <Grid item xs={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => importLabel({ variables: { type: 6 } })}
              >
                Import Exchanges
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </main>
  )
}

export default Settings

import React, { useCallback, useEffect, useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Table from '@material-ui/core/Table'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TablePagination from '@material-ui/core/TablePagination'
import Paper from '@material-ui/core/Paper'
import { map, get, truncate, slice } from 'lodash'
import Button from '@material-ui/core/Button'
import { useLazyQuery, useQuery } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'
import { Link } from 'react-router-dom'
import download from 'downloadjs'
import { useIntl } from 'react-intl'
import Grid from '@material-ui/core/Grid'
import TableMenu from '../components/TableMenu'
import Tooltip from '@material-ui/core/Tooltip'
import EnhancedTableHead from '../components/EnhancedTableHead'
import TableBodyEnhanced from '../components/TableBodyEnhanced'
import { headCells } from './configuration'

const LOAD_ADDRESS_FEATURES = gql`
  query AddressFeatures($orderBy: Order, $offset: Int!, $limit: Int!) {
    addressFeatures(orderBy: [$orderBy], offset: $offset, limit: $limit) {
      rows {
        id
        hash
        scam
        numberOfNone
        numberOfOneTime
        numberOfExchange
        numberOfMiningPool
        numberOfMiner
        numberOfSmContract
        numberOfERC20
        numberOfERC721
        numberOfTrace
        numberOfTransactions
        numberOfTransInput
        numberOfTransOutput
        medianOfEthProTrans
        averageOfEthProTrans
        numberOfNoneInput
        numberOfOneTimeInput
        numberOfExchangeInput
        numberOfMiningPoolInput
        numberOfMinerInput
        numberOfSmContractInput
        numberOfERC20Input
        numberOfERC721Input
        numberOfTraceInput
        transInputMedian
        transOutputMedian
        transInputAverage
        transOutputAverage
        minEth
        maxEth
        transInputMinEth
        transInputMaxEth
        transOutputMinEth
        transOutputMaxEth
        transInputMedianEth
        transInputAverageEth
        transOutputMedianMinEth
        transOutputAverageEth
        numberOfScamNeighbor
        numberOfScamNeighborInput
        numberOfNoneTr
        numberOfOneTimeTr
        numberOfExchangeTr
        numberOfMiningPoolTr
        numberOfMinerTr
        numberOfSmContractTr
        numberOfERC20Tr
        numberOfERC721Tr
        numberOfTraceTr
      }
      count
    }
  }
`

//transactionFeatures

const LOAD_TRANSACTION_FEATURES = gql`
  query TransactionFeatures {
    transactionFeatures {
      id
      amount
      timestamp
      to
      scam
    }
  }
`
const headTransactionCells = [
  { id: 'id' },
  { id: 'scam' },
  { id: 'amount' },
  { id: 'timestamp' },
]

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
  },
  button: {
    padding: 0,
  },
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
  },
  table: {
    minWidth: 750,
  },
  visuallyHidden: {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    top: 20,
    width: 1,
  },
  tableContainer: {
    maxHeight: 440,
    overflowX: 'auto',
    overflowY: 'auto',
  },
}))

const exportToCSV = (headCells, rows, formatNumber) => {
  const headers = map(headCells, 'id').join(';')
  const rowsString = map(rows, row =>
    map(headCells, ({ id, numeric }) =>
      numeric ? formatNumber(row[id]) : String(row[id])
    ).join(';')
  ).join('\r\n')
  // TODO add improvement with unit8Byte
  download(
    `data:text/csv;charset=utf-8,\ufeff${encodeURI(
      `${headers}\r\n${rowsString}`
    )}`,
    `addressFeature-${new Date().toISOString()}.csv`,
    'text/csv'
  )
}

const FeatureTable = ({ buildFeatures, recalcFeatures, openInfo }) => {
  const classes = useStyles()
  const { formatNumber } = useIntl()
  const [order, setOrder] = useState('asc')
  const [orderBy, setOrderBy] = useState('id') // sorting option
  const [selected, setSelected] = useState([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [orderByQuery, setOrderQuery] = useState({
    field: 'id',
    type: 'ASC',
  })
  const {
    data,
    refetch,
    loading: exportAddFeatureRunning,
    networkStatus,
  } = useQuery(LOAD_ADDRESS_FEATURES, {
    variables: {
      orderBy: orderByQuery,
      offset: page * rowsPerPage,
      limit: rowsPerPage,
    },
  })
  const [
    getTransactionFeatures,
    {
      data: transFeatures,
      refetch: refetchTransFeatures,
      loading: exportTransFeatureRunning,
      called,
    },
  ] = useLazyQuery(LOAD_TRANSACTION_FEATURES)

  let rows = get(data, 'addressFeatures.rows', [])
  rows = slice(rows, 0, rowsPerPage) // hack because of export/refetching
  const count = get(data, 'addressFeatures.count', -1)
  const exportAddFeatures = useCallback(async () => {
    const { data: dataToExport } = await refetch({
      orderBy: orderByQuery,
      offset: 0,
      limit: 0,
    })
    const rows = get(dataToExport, 'addressFeatures.rows', [])
    exportToCSV(headCells, rows, formatNumber)
  })

  useEffect(() => {
    // TODO every time download?
    if (called) {
      exportToCSV(headTransactionCells, transFeatures, formatNumber)
    }
  }, [transFeatures, getTransactionFeatures])
  const exportTransFeatures = useCallback(async () => {
    await getTransactionFeatures()
    // const { data } = await getTransactionFeatures()
    // const rows = get(data, 'addressFeatures.rows', [])
    // exportToCSV(headCells, rows, formatNumber)
  })
  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
    setOrderQuery({ field: property, type: isAsc ? 'DESC' : 'ASC' })
  }

  const handleSelectAllClick = event => {
    if (event.target.checked) {
      const newSelecteds = rows.map(n => n.name)
      setSelected(newSelecteds)
      return
    }
    setSelected([])
  }

  const handleClick = (event, name) => {
    const selectedIndex = selected.indexOf(name)
    let newSelected = []

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name)
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1))
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1))
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      )
    }

    setSelected(newSelected)
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const emptyRows = rowsPerPage - Math.min(rowsPerPage, rows.length)
  // TODO Menu stat 3 Buttons
  // buildFeatures disabled
  const openInfoModal = useCallback(() => {
    openInfo({
      title: 'Features list',
      infoText: (
        <span>
          The list show the calculated features. There is option in menu to
          calculate new imported addresses, that have not been calculated and to
          recalculate the all features in the list.
          <br />
          The last options wil take a lot of time because there is addresses
          that habe ca. 400 000 Transaction, that must be taken from databases
          before calculation. This need big hardware resources.
          <br />
          There is also an option to export all existed features
        </span>
      ),
    })
  })
  return (
    <Paper elevation={3} className={classes.root}>
      <Grid container justify="space-between" alignItems="center">
        <Grid item>
          <div>
            <span>Feature table</span>
          </div>
        </Grid>
        <Grid item>
          <TableMenu
            menuItems={[
              { label: 'Build features for new A.', handler: buildFeatures },
              { label: 'Recalculate features', handler: recalcFeatures },
              {
                label: 'Export address features',
                handler: exportAddFeatures,
              },
              { label: 'Info', handler: openInfoModal },
            ]}
          />
        </Grid>
      </Grid>
      <Paper elevation={0} className={classes.paper}>
        <TableContainer className={classes.tableContainer}>
          <Table
            stickyHeader
            className={classes.table}
            aria-labelledby="tableTitle"
            size="small"
            aria-label="enhanced table"
          >
            <EnhancedTableHead
              classes={classes}
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={rows.length}
              headCells={headCells}
            />
            <TableBodyEnhanced
              classes={classes}
              rows={rows}
              headCells={headCells}
              emptyRows={emptyRows}
            />
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={count}
          rowsPerPage={rowsPerPage}
          page={page}
          onChangePage={handleChangePage}
          onChangeRowsPerPage={handleChangeRowsPerPage}
        />
      </Paper>
    </Paper>
  )
}

export default FeatureTable

/* eslint-env mocha */
/* global self */

'use strict'

const eachSeries = require('async/eachSeries')
const Store = require('idb-pull-blob-store')
const _ = require('lodash')
const IPFSRepo = require('ipfs-repo')
const pull = require('pull-stream')
const repoContext = require.context('buffer!./example-repo', true)

const basePath = 'ipfs' + Math.random()

const idb = self.indexedDB ||
  self.mozIndexedDB ||
  self.webkitIndexedDB ||
  self.msIndexedDB

idb.deleteDatabase(basePath)
idb.deleteDatabase(basePath + '/blocks')

describe('Browser', () => {
  before((done) => {
    const repoData = []
    repoContext.keys().forEach((key) => {
      repoData.push({
        key: key.replace('./', ''),
        value: repoContext(key)
      })
    })

    const mainBlob = new Store(basePath)
    const blocksBlob = new Store(basePath + '/blocks')

    eachSeries(repoData, (file, cb) => {
      if (_.startsWith(file.key, 'datastore/')) {
        return cb()
      }

      const blocks = _.startsWith(file.key, 'blocks/')
      const blob = blocks ? blocksBlob : mainBlob
      const key = blocks ? file.key.replace(/^blocks\//, '') : file.key

      pull(
        pull.values([file.value]),
        blob.write(key, cb)
      )
    }, done)
  })

  const repo = new IPFSRepo(basePath, { stores: Store })

  require('./basics')(repo)
  require('./ipld-dag-pb')(repo)
  require('./ipld-dag-cbor')(repo)
  require('./ipld-eth-block')(repo)
  require('./ipld-eth-star')(repo)
  require('./ipld-all')
})

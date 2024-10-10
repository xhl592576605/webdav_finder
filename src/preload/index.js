import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

let webdav = null
import('webdav').then((res) => (webdav = res))

let webdav_client = null
const webdav_api = {
  login: (remoteURL, options) => {
    return new Promise((resolve, reject) => {
      if (!webdav) {
        reject(new Error('webdav module not found'))
        return
      }
      try {
        webdav_client = webdav.createClient(remoteURL, options)
        webdav_client.exists('/').then((res) => resolve(res))
        console.log(webdav_client)
      } catch (e) {
        reject(e)
      }
    })
  },
  login_out: () => {
    webdav_client = null
    return true
  },
  getDirectoryContents: (path) => {
    return webdav_client.getDirectoryContents(path)
  }
}

// Custom APIs for renderer
const api = {
  webdav: webdav_api
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}

import { contextBridge, shell } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import Path from 'path'
import fs from 'fs'

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
        webdav_client.remoteURL = remoteURL
        webdav_client.options = options
        console.log('webdav_client', webdav_client)
        webdav_client
          .exists('/')
          .then((res) => resolve(res))
          .catch((e) => reject(e))
      } catch (e) {
        reject(e)
      }
    })
  },
  login_out: () => {
    webdav_client = null
    return true
  },
  getDirectoryContents: (path, options) => {
    if (!webdav_client) {
      return Promise.reject(new Error('webdav client not login'))
    }
    return webdav_client
      .getDirectoryContents(path, {
        details: true,
        ...(options || {})
      })
      .then((res) => {
        return res.data.map((content) => {
          const ext = Path.extname(content.basename)
          content = {
            ...content,
            ...(content.props || {}),
            ext,
            downloadLink: ext ? webdav_client.remoteURL + content.filename : '' // webdav_client.getFileDownloadLink(content.filename) : ''
          }
          delete content.props
          return content
        })
      })
  },
  async createDirectory(dir_path) {
    if (!webdav) {
      throw new Error('webdav module not found')
    }
    const dir_exists = await webdav_client.exists(dir_path)
    if (!dir_exists) {
      return webdav_client.createDirectory(dir_path, {
        recursive: true
      })
    }
  },
  uploadFile: (file_path, remote_path, onUploadProgress, options) => {
    return new Promise((resolve, reject) => {
      if (!webdav) {
        reject(new Error('webdav module not found'))
        return
      }
      const file = Path.parse(file_path)
      remote_path = Path.join(remote_path, file.base)
      const readStream = fs.createReadStream(file_path)
      const writeStream = webdav_client.createWriteStream(remote_path, options)
      let totalBytes = 0 // 已上传的总字节数
      const fileSize = fs.statSync(file_path).size // 文件总大小

      readStream.on('data', (chunk) => {
        totalBytes += chunk.length
        if (onUploadProgress) {
          onUploadProgress({
            totalBytes,
            fileSize,
            percent: totalBytes / fileSize,
            filename: file.base
          })
        }
      })

      writeStream.on('finish', () => {
        resolve({
          remote_path,
          filename: file.base
        })
      })
      writeStream.on('error', (e) =>
        reject({
          remote_path,
          filename: file.base,
          error: e
        })
      )
      readStream.pipe(writeStream)
    })
  },
  uploadDirectory: async (local_path, remote_path, onUploadProgress, options) => {
    if (!webdav) {
      throw new Error('webdav module not found')
    }
    const parent_path = Path.parse(local_path)
    await webdav_api.createDirectory(Path.join(remote_path, parent_path.name))
    const files = fs.readdirSync(local_path, {
      recursive: true
    })
    for (const file of files) {
      const full_path = Path.join(local_path, file)
      const stats = await fs.statSync(full_path) // 这个判断有问题判断不出隐藏文件和双重后缀
      const _file = Path.parse(file)
      if (stats.isFile()) {
        await webdav_api.uploadFile(
          full_path,
          Path.join(remote_path, parent_path.name, _file.dir),
          onUploadProgress,
          options
        )
      } else if (stats.isDirectory()) {
        await webdav_api.createDirectory(Path.join(remote_path, parent_path.name, _file.name))
      }
    }
  },
  moveFile: (filename, destinationFilename) => {
    if (!webdav) {
      return Promise.reject(new Error('webdav module not found'))
    }
    return webdav_client.moveFile(filename, destinationFilename)
  },
  copyFile: (filename, destinationFilename) => {
    if (!webdav) {
      return Promise.reject(new Error('webdav module not found'))
    }
    return webdav_client.copyFile(filename, destinationFilename)
  },
  deleteFile: (filename) => {
    if (!webdav) {
      return Promise.reject(new Error('webdav module not found'))
    }
    return webdav_client.deleteFile(filename)
  },
  downloadFile: (file_path, remote_path, onDownloadProgress, options) => {
    return new Promise((resolve, reject) => {
      if (!webdav) {
        reject(new Error('webdav module not found'))
        return
      }
      const file = Path.parse(remote_path)
      file_path = Path.join(file_path, file.base)
      const readStream = webdav_client.createReadStream(remote_path, options)
      const writeStream = fs.createWriteStream(file_path)
      let totalBytes = 0 // 已经下载的字节数
      webdav_client
        .stat(remote_path) //todo 这个大小获取好像有问题，比较大的不好返回 看服务器
        .then((res) => {
          const fileSize = res.size // 文件总大小
          if (!fileSize) {
            resolve()
            return
          }
          readStream.on('data', (chunk) => {
            totalBytes += chunk.length
            if (onDownloadProgress) {
              onDownloadProgress({
                totalBytes,
                fileSize,
                percent: totalBytes / fileSize,
                filename: remote_path
              })
            }
          })

          writeStream.on('finish', () => {
            resolve({
              file_path,
              filename: remote_path
            })
          })
          writeStream.on('error', (e) =>
            reject({
              file_path,
              filename: remote_path,
              error: e
            })
          )
          readStream.pipe(writeStream)
        })
        .catch((e) => reject(e))
    })
  },
  downloadDirectory: async (local_path, remote_path, onDownloadProgress, options) => {
    if (!webdav) {
      throw new Error('webdav module not found')
    }
    const parent_path = Path.parse(remote_path)
    const full_path = Path.join(local_path, parent_path.name)
    await fs.mkdirSync(full_path, {
      recursive: true
    })
    const files = await webdav_api.getDirectoryContents(remote_path)
    for (const file of files) {
      if (!file.isfolder) {
        await webdav_api.downloadFile(full_path, file.filename, onDownloadProgress, options)
      } else if (file.isfolder) {
        await webdav_api.downloadDirectory(full_path, file.filename, onDownloadProgress, options)
      }
    }
  }
}
const diaLog = {
  showOpenDialog: (options) => {
    return electronAPI.ipcRenderer.invoke('showOpenDialog', options)
  }
}

// Custom APIs for renderer
const api = {
  webdav: webdav_api,
  diaLog,
  openPath: (path) => {
    return shell.openPath(path)
  }
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

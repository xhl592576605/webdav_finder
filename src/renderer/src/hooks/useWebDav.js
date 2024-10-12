import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import { message, Modal } from 'ant-design-vue'
import ContextMenu from '@imengyu/vue3-context-menu'

import useModal from './useModal'
export default () => {
  const api = window.api
  const webdav_api = window.api.webdav
  const diaLog = window.api.diaLog
  const electron = window.electron

  const { showProgress, showRename, showDetail } = useModal()

  const remotePaths = ref([])
  const currentRemotePath = computed(() => {
    return remotePaths.value.join('/')
  })

  const fileList = ref([])

  const fileListContainer = ref()
  const copyPath = ref({})

  const getDirectoryContents = (path) => {
    return webdav_api.getDirectoryContents(path).then((files) => {
      fileListContainer?.value?.scrollTo({ top: 0, behavior: 'smooth' })
      fileList.value = files
        .filter((f) => !f.ishidden)
        .map((file) => {
          const ext = file.ext.replace('.', '')
          return {
            ...file,
            icon: ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)
              ? file.downloadLink
              : `/file-icons/${file.isfolder ? 'floder' : ext ? ext : 'file'}.png`,
            createdate: dayjs(file.creationdate).format('YYYY-MM-DD HH:mm:ss'),
            lastmodified: dayjs(file.lastmod).format('YYYY-MM-DD HH:mm:ss')
          }
        })
    })
  }
  const cdDirectory = (path) => {
    if (path) {
      remotePaths.value.push(path)
    } else {
      remotePaths.value = []
    }
    return getDirectoryContents(currentRemotePath.value)
  }
  const cdDirectoryIndex = (index) => {
    if (index >= 0) {
      remotePaths.value.splice(index + 1)
    } else {
      remotePaths.value = []
    }
    return getDirectoryContents(currentRemotePath.value)
  }

  const mkDirectory = () => {
    showRename({
      title: '新建文件夹',
      name: '新建文件夹',
      icon: '/file-icons/floder.png',
      onOk: (res) => {
        if (!res) {
          return
        }
        webdav_api
          .createDirectory(currentRemotePath.value + '/' + res.name)
          .then(() => {
            getDirectoryContents(currentRemotePath.value)
            message.success(`创建文件夹"${res.name}"成功`)
          })
          .catch((e) => {
            message.error(`创建文件夹"${res.name}"失败:${e.message}`)
          })
      }
    })
  }

  const uploadFile = () => {
    diaLog
      .showOpenDialog({
        title: '请选择上传文件',
        properties: ['openFile']
      })
      .then((paths) => {
        if (paths.length <= 0) {
          return
        }
        const file_path = paths[0]
        const percent = ref(0)
        const { destroy } = showProgress({
          title: ref('上传进度'),
          percent
        })
        webdav_api
          .uploadFile(file_path, currentRemotePath.value, (p) => {
            percent.value = parseInt(p.percent * 100)
          })
          .then((res) => {
            getDirectoryContents(currentRemotePath.value)
            message.success(`${res.filename} 上传成功`)
            destroy()
          })
          .catch((e) => {
            if (e.filename) {
              message.error(`${e.filename} 上传失败:${e.error.message}`)
              return
            }
            message.error(`上传失败:${e.message}`)
            destroy()
          })
      })
  }
  const uploadDir = () => {
    diaLog
      .showOpenDialog({
        title: '请选择上传文件夹',
        properties: ['openDirectory']
      })
      .then((paths) => {
        if (paths.length <= 0) {
          return
        }
        const file_path = paths[0]
        const title = ref('上传进度')

        const percent = ref(0)
        const { destroy } = showProgress({
          title,
          percent
        })
        webdav_api
          .uploadDirectory(file_path, currentRemotePath.value, (p) => {
            title.value = `上传中:${p.filename}`
            percent.value = parseInt(p.percent * 100)
          })
          .then(() => {
            getDirectoryContents(currentRemotePath.value)
            message.success(`上传成功`)
            destroy()
          })
          .catch((e) => {
            message.error(`上传失败:${e.message}`)
            destroy()
          })
      })
  }

  const downloadFile = (file) => {
    diaLog
      .showOpenDialog({
        title: '请选择下载文件夹',
        properties: ['openDirectory']
      })
      .then((paths) => {
        if (paths.length <= 0) {
          return
        }
        const file_path = paths[0]
        const title = ref('下载进度')

        const percent = ref(0)
        const { destroy } = showProgress({
          title,
          percent
        })
        webdav_api
          .downloadFile(file_path, file.filename, (p) => {
            percent.value = parseInt(p.percent * 100)
          })
          .then(() => {
            message.success(`下载成功，请到文件夹查看`)
            destroy()
          })
          .catch((e) => {
            message.error(`下载失败:${e.message}`)
            destroy()
          })
      })
  }

  const downloadDirectory = (file) => {
    diaLog
      .showOpenDialog({
        title: '请选择下载文件夹',
        properties: ['openDirectory']
      })
      .then((paths) => {
        if (paths.length <= 0) {
          return
        }
        const file_path = paths[0]
        const title = ref('下载进度')

        const percent = ref(0)
        const { destroy } = showProgress({
          title,
          percent
        })
        webdav_api
          .downloadDirectory(file_path, file.filename, (p) => {
            title.value = `下载中:${p.filename}`
            percent.value = parseInt(p.percent * 100)
          })
          .then(() => {
            message.success(`下载成功，请到文件夹查看`)
            destroy()
          })
          .catch((e) => {
            message.error(`下载失败:${e.message}`)
            destroy()
          })
      })
  }

  const openFile = (file) => {
    const file_path = electron.process.env.TMPDIR
    const title = ref('打开进度')

    const percent = ref(0)
    const { destroy } = showProgress({
      title,
      percent
    })
    webdav_api
      .downloadFile(file_path, file.filename, (p) => {
        percent.value = parseInt(p.percent * 100)
      })
      .then((res) => {
        message.success(`即将打开`)
        destroy()
        return api.openPath(res.file_path)
      })
      .catch((e) => {
        message.error(`打开失败:${e.message}`)
        destroy()
      })
  }

  const rename = (file) => {
    showRename({
      title: '重命名',
      name: file.displayname,
      path: file.filename,
      icon: file.icon,
      onOk: (res) => {
        if (!res) {
          return
        }
        webdav_api
          .moveFile(res.path, res.path.replace(res.old_name, res.name))
          .then(() => {
            getDirectoryContents(currentRemotePath.value)
            message.success(`重命名"${res.old_name}"为"${res.name}"成功`)
          })
          .catch((e) => {
            message.error(`重命名"${res.name}"失败:${e.message}`)
          })
      }
    })
  }
  const deleteFile = (file) => {
    Modal.warning({
      title: file.isfolder ? '删除文件夹' : '删除文件',
      content: file.isfolder
        ? `确定删除文件夹(包含内部文件）：${file.displayname}？`
        : `确定删除文件：${file.displayname}？`,
      onOk() {
        webdav_api
          .deleteFile(file.filename)
          .then(() => {
            getDirectoryContents(currentRemotePath.value)
            message.success(`删除"${file.displayname}"成功`)
          })
          .catch((e) => {
            message.error(`删除"${file.displayname}"失败:${e.message}`)
          })
      }
    })
  }

  const detail = (file) => {
    console.log(file)
    showDetail({
      title: file.displayname,
      name: file.displayname,
      path: file.filename,
      icon: file.icon,
      file: file
    })
  }
  const onFileContextMenu = (e, file) => {
    e.preventDefault()
    const instance = ContextMenu.showContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          label: '打开',
          onClick: () => {
            instance.closeMenu()
            if (file.isfolder) {
              cdDirectory(file.base)
            } else {
              //electron.process.TMPDIR
              openFile(file)
            }
          }
        },
        {
          label: '下载',
          onClick: () => {
            instance.closeMenu()
            if (file.isfolder) {
              downloadDirectory(file)
              return
            }
            downloadFile(file)
          }
        },
        {
          label: '重命名',
          onClick: () => {
            instance.closeMenu()
            rename(file)
          }
        },
        {
          label: '剪切',
          onClick: () => {
            instance.closeMenu()
            copyPath.value.path = file.filename
            copyPath.value.name = file.displayname
            copyPath.value.type = 1
          }
        },
        {
          label: '复制',
          onClick: () => {
            instance.closeMenu()
            copyPath.value.path = file.filename
            copyPath.value.name = file.displayname
            copyPath.value.type = 2
          }
        },
        {
          label: '属性',
          onClick: () => {
            instance.closeMenu()
            detail(file)
          }
        },
        {
          label: '删除',
          onClick: () => {
            instance.closeMenu()
            deleteFile(file)
          }
        }
      ]
    })
  }

  const onFilesContextMenu = (e) => {
    e.preventDefault()
    if (!e.target.classList.contains('finder_list')) {
      return
    }
    if (copyPath.value.path === undefined) {
      return
    }
    const instance = ContextMenu.showContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        {
          label: '粘贴',
          onClick: () => {
            instance.closeMenu()
            if (copyPath.value.type === 1) {
              //剪切
              webdav_api
                .moveFile(copyPath.value.path, currentRemotePath.value + '/' + copyPath.value.name)
                .then(() => {
                  getDirectoryContents(currentRemotePath.value)
                  message.success(`剪切"${copyPath.value.path}"到"${currentRemotePath.value}"成功`)
                })
              return
            }
            // const new_names = copyPath.value.name.split('.')
            // new_names.splice(new_names.length - 1, 0, '-copy')
            // const new_name = new_names.join('.')
            // const new_name = copyPath.value.name.replace()
            webdav_api
              .copyFile(copyPath.value.path, currentRemotePath.value + '/' + copyPath.value.name)
              .then(() => {
                getDirectoryContents(currentRemotePath.value)
                message.success(`粘贴"${copyPath.value}"到"${currentRemotePath.value}"成功`)
              })
          }
        }
      ]
    })
  }
  const onFileContainerClick = (e) => {
    e.preventDefault()
    ContextMenu.closeContextMenu()
  }

  onMounted(() => {
    getDirectoryContents(currentRemotePath.value)
  })

  return {
    remotePaths,
    currentRemotePath,
    fileList,
    fileListContainer,
    getDirectoryContents,
    cdDirectory,
    cdDirectoryIndex,
    mkDirectory,
    uploadFile,
    uploadDir,
    onFileContextMenu,
    onFilesContextMenu,
    onFileContainerClick
  }
}

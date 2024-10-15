import { ref, computed, onMounted, nextTick, watchEffect } from 'vue'
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

  const fileDisplayNameFilter = ref('')
  const fileList = ref([])

  const renderFileList = ref([])
  watchEffect(() => {
    if (fileDisplayNameFilter.value) {
      renderFileList.value = fileList.value.filter((f) =>
        f.displayname.toUpperCase().includes(fileDisplayNameFilter.value.toUpperCase())
      )
    }
    renderFileList.value = fileList.value
  })

  const selectedFiles = ref([])

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
      clearSelectedFile()
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
    showDetail({
      title: file.displayname,
      name: file.displayname,
      path: file.filename,
      icon: file.icon,
      file: file
    })
  }

  const selectFileCheckedAll = computed(() => {
    return (
      selectedFiles.value.length > 0 && selectedFiles.value.length === renderFileList.value.length
    )
  })
  const onSelectFileCheckedAllChange = (e) => {
    clearSelectedFile()
    if (e.target.checked) {
      renderFileList.value.forEach((file) => {
        selectFile(file.filename)
      })
    }
  }
  const selectFile = (filename) => {
    selectedFiles.value.push(filename)
  }
  const removeSelectedFile = (filename) => {
    selectedFiles.value = selectedFiles.value.filter((f) => f !== filename)
  }

  const clearSelectedFile = () => {
    selectedFiles.value = []
  }

  const onFileClick = (file) => {
    if (isCtrlOrCmdKeyDown) {
      // 按住了ctrl键 or command键
      if (selectedFiles.value.indexOf(file.filename) > -1) {
        removeSelectedFile(file.filename)
        return
      }
      selectFile(file.filename)
      return
    }
    if (selectedFiles.value.indexOf(file.filename) === 0) {
      removeSelectedFile(file.filename)
      return
    }
    clearSelectedFile()
    selectFile(file.filename)
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

  let dropTarget = null

  const querySelectorDragItem = (item) => {
    if (!item.classList.contains('list_item')) {
      item = item.closest('.list_item')
    }
    return item
  }
  const onFileDragStart = (e) => {
    const moveFile = []

    selectedFiles.value.forEach((item) => {
      const ele = fileListContainer.value.querySelector(`[data-filename="${item}"]`)
      ele.dataset.isDragging = true
      moveFile.push({
        filename: ele.dataset.filename,
        displayname: ele.dataset.displayname
      })
    })
    const target = querySelectorDragItem(e.target)
    if (target) {
      target.dataset.isDragging = true
    }
    if (moveFile.findIndex((f) => f.filename === target.dataset.filename) < 0) {
      moveFile.push({
        filename: target.dataset.filename,
        displayname: target.dataset.displayname
      })
    }
    e.dataTransfer.setData('text/plain', JSON.stringify(moveFile))

    // const img = new Image()
    // img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='
    // e.dataTransfer.setDragImage(img, e.x, e.y)
  }

  const onFileDragEnd = (e) => {
    if (!dropTarget) {
      return
    }
    if (dropTarget) {
      dropTarget.dataset.dropTarget = false
    }
    const txt = e.dataTransfer.getData('text/plain')
    const moveFile = JSON.parse(txt)
    const moveFileFunc = moveFile.map((file) => {
      return webdav_api
        .moveFile(file.filename, dropTarget.dataset.filename + '/' + file.displayname)
        .then(() => {
          message.success(`剪切"${file.filename}"到"${dropTarget.dataset.filename}"成功`)
        })
    })
    return Promise.all(moveFileFunc).then(() => {
      selectedFiles.value = []
      getDirectoryContents(currentRemotePath.value)

      dropTarget = null
    })
  }

  const onFileDragEnter = (e) => {
    const fileElements = fileListContainer.value.querySelectorAll('.list_item')
    fileElements.forEach((fileElement) => {
      fileElement.dataset.dropTarget = false
    })

    const toElement = querySelectorDragItem(e.toElement)
    if (toElement) {
      toElement.dataset.dropTarget = true
      dropTarget = toElement
    }
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
            const new_names = copyPath.value.name.split('.')
            new_names[0] = new_names[0] + '-copy'
            const new_name = new_names.join('.')
            webdav_api
              .copyFile(copyPath.value.path, currentRemotePath.value + '/' + new_name)
              .then(() => {
                getDirectoryContents(currentRemotePath.value)
                message.success(`粘贴"${copyPath.value.path}"到"${currentRemotePath.value}"成功`)
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
  const moveSelectedFlag = ref(false)
  const moveSelected = ref({
    left: 0,
    top: 0
  })

  const onFileMouseMoveSelect = async () => {
    await nextTick()

    const createMaskEle = () => {
      const ele = document.createElement('div')
      ele.className = 'move-selected-mask'
      ele.style.position = 'absolute'
      ele.style.width = '0px'
      ele.style.height = '0px'
      ele.style.backgroundColor = 'rgba(99, 125, 255,0.24)'
      ele.style.border = '1px solid rgba(31, 203, 247)'
      return ele
    }

    const findSelected = () => {
      if (!moveSelectedMaskEle || !moveSelectedFlag.value) {
        return
      }
      const fileElements = fileListContainer.value.querySelectorAll('.list_item')
      const {
        left: mask_left,
        right: mask_right,
        top: mask_top,
        bottom: mask_bottom
      } = moveSelectedMaskEle.getBoundingClientRect()
      fileElements.forEach((element) => {
        const { left, right, top, bottom } = element.getBoundingClientRect()
        const leftFlag = mask_left <= left && left <= mask_right
        const rightFlag = mask_left <= right && right < mask_right
        const topFlag = mask_top <= top && top <= mask_bottom
        const bottomFlag = mask_top <= bottom && bottom <= mask_bottom

        if ((leftFlag || rightFlag) && (topFlag || bottomFlag)) {
          selectedFiles.value.push(element.dataset.filename)
        }
      })
    }

    let moveSelectedMaskEle = null
    fileListContainer.value.addEventListener('mousedown', (e) => {
      moveSelectedMaskEle = createMaskEle()
      moveSelectedMaskEle.style.left = e.clientX + 'px'
      moveSelectedMaskEle.style.top = e.clientY + 'px'
      fileListContainer.value.appendChild(moveSelectedMaskEle)
      moveSelectedFlag.value = true
      moveSelected.value = {
        left: e.clientX,
        top: e.clientY
      }
    })
    fileListContainer.value.addEventListener('mousemove', (e) => {
      e.preventDefault()
      if (!moveSelectedFlag.value || moveSelectedMaskEle == null) {
        return
      }
      clearSelectedFile()
      moveSelectedMaskEle.style.width = Math.abs(e.clientX - moveSelected.value.left) + 'px'
      moveSelectedMaskEle.style.height = Math.abs(e.clientY - moveSelected.value.top) + 'px'
      moveSelectedMaskEle.style.left = Math.min(e.clientX, moveSelected.value.left) + 'px'
      moveSelectedMaskEle.style.top = Math.min(e.clientY, moveSelected.value.top) + 'px'
      findSelected()
      // todo： 如果有滚动条
      // fileListContainer?.value?.scrollTo({
      //   top: fileListContainer.value.scrollTop + (e.clientY - lastMouseMoveY) * 50,
      //   behavior: 'smooth'
      // })
    })
    fileListContainer.value.addEventListener('mouseup', () => {
      moveSelectedFlag.value = false
      if (moveSelectedMaskEle) {
        moveSelectedMaskEle.remove()
        moveSelectedMaskEle = null
      }

      moveSelected.value = {
        left: 0,
        top: 0
      }
    })
    fileListContainer.value.addEventListener('mouseleave', () => {
      moveSelectedFlag.value = false
      if (moveSelectedMaskEle) {
        moveSelectedMaskEle.remove()
        moveSelectedMaskEle = null
      }
    })
  }

  let isCtrlOrCmdKeyDown = false
  const onKeyDown = () => {
    document.addEventListener('keydown', function (event) {
      var isMac = navigator.userAgentData.platform.toUpperCase().indexOf('MAC') !== -1

      if ((isMac && event.metaKey) || (!isMac && event.ctrlKey)) {
        isCtrlOrCmdKeyDown = true
      }
    })

    document.addEventListener('keyup', function (event) {
      var isMac = navigator.userAgentData.platform.toUpperCase().indexOf('MAC') !== -1
      if ((isMac && !event.metaKey) || (!isMac && !event.ctrlKey)) {
        isCtrlOrCmdKeyDown = false
      }
    })
  }

  onMounted(() => {
    getDirectoryContents(currentRemotePath.value)
    onFileMouseMoveSelect()
    onKeyDown()
  })

  return {
    remotePaths,
    currentRemotePath,
    fileList,
    renderFileList,
    fileDisplayNameFilter,
    selectedFiles,
    selectFileCheckedAll,
    onSelectFileCheckedAllChange,
    fileListContainer,
    getDirectoryContents,
    cdDirectory,
    cdDirectoryIndex,
    mkDirectory,
    uploadFile,
    uploadDir,
    openFile,
    onFileClick,
    onFileContextMenu,
    onFilesContextMenu,
    onFileContainerClick,
    onFileDragStart,
    onFileDragEnd,
    onFileDragEnter
  }
}

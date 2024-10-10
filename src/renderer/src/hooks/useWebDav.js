import { ref, computed, onMounted } from 'vue'
export default () => {
  const webdav_api = window.api.webdav

  const remotePaths = ref([])
  const currentRemotePath = computed(() => {
    return remotePaths.value.join('/')
  })

  const fileList = ref([])
  const getDirectoryContents = (path) => {
    return webdav_api.getDirectoryContents(path)
  }

  onMounted(() => {
    getDirectoryContents(currentRemotePath.value).then((files) => {
      fileList.value = files
      console.log(fileList.value)
    })
  })
  return {
    remotePaths,
    currentRemotePath,
    fileList,
    getDirectoryContents
  }
}

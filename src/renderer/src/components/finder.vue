<script setup lang="ts">
import { message } from 'ant-design-vue'

import useWebDav from '../hooks/useWebDav'
defineProps({
  loginState: Boolean
})

const emits = defineEmits(['close'])

const {
  remotePaths,
  renderFileList,
  fileDisplayNameFilter,
  selectedFiles,
  selectFileCheckedAll,
  onSelectFileCheckedAllChange,
  fileListContainer,
  cdDirectory,
  cdDirectoryIndex,
  mkDirectory,
  uploadFile,
  uploadDir,
  openFile,
  onFileClick,
  onFileContextMenu,
  onFileContainerClick,
  onFilesContextMenu,
  onFileDragStart,
  onFileDragEnd,
  onFileDragEnter
} = useWebDav()

const close_webdav = () => {
  window.api.webdav.login_out()
  emits('close')
  message.success('已断开连接')
}
</script>

<template>
  <div class="webdav_finder">
    <div class="finder_header">
      <div class="search">
        <a-input-search
          v-model:value="fileDisplayNameFilter"
          placeholder="搜索当前目录"
          enter-button
        />
      </div>
      <div class="close-webdav">
        <a-button type="primary" danger @click="close_webdav">关闭连接</a-button>
      </div>
    </div>
    <div class="finder_content">
      <div class="finder_toolbar">
        <a-button @click="mkDirectory">新建文件夹</a-button>
        <a-button @click="uploadFile">上传文件</a-button>
        <a-button @click="uploadDir">上传文件夹</a-button>
      </div>
      <div class="finder_breadcrumb">
        <a-breadcrumb class="path-router">
          <a-breadcrumb-item>
            <a @click="cdDirectoryIndex(index)">全部文件</a>
          </a-breadcrumb-item>
          <template v-for="(item, index) in remotePaths" :key="index">
            <a-breadcrumb-item>
              <a @click="cdDirectoryIndex(index)">{{ item }}</a>
            </a-breadcrumb-item>
          </template>
        </a-breadcrumb>
      </div>
      <div class="finder_operation">
        <a-checkbox
          v-model:checked="selectFileCheckedAll"
          :indeterminate="selectedFiles.length > 0 && selectedFiles.length < renderFileList.length"
          @change="onSelectFileCheckedAllChange"
          >{{
            selectedFiles.length === 0
              ? `共${renderFileList.length}项`
              : `已选${selectedFiles.length}项`
          }}</a-checkbox
        >
      </div>
      <div
        ref="fileListContainer"
        class="finder_list"
        @click="onFileContainerClick"
        @contextmenu="(e) => onFilesContextMenu(e)"
      >
        <template v-for="file in renderFileList" :key="file.filename">
          <div
            class="list_item"
            :data-is-dragging="false"
            :data-drop-target="false"
            :data-is-selected="selectedFiles.indexOf(file.filename) > -1"
            :data-filename="file.filename"
            :data-displayname="file.displayname"
            :draggable="true"
            @click="onFileClick(file)"
            @mousedown.stop
            @dblclick="file.isfolder ? cdDirectory(file.displayname) : openFile(file)"
            @contextmenu="(e) => onFileContextMenu(e, file)"
            @dragstart="onFileDragStart($event, file)"
            @drop="onFileDragEnd($event, file)"
            @dragenter="onFileDragEnter($event, file)"
            @dragover.prevent
          >
            <div class="item_icon"><img :src="file.icon" class="" alt="" loading="lazy" /></div>
            <div class="item_name">{{ file.displayname }}</div>
            <div class="item_modified">{{ file.lastmodified }}</div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.webdav_finder {
  width: 100%;
  height: 100%;
  padding: 10px;
  background-color: #ffffff;
  .finder_header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 50px;
    margin: 0 10px;
    .search {
      display: flex;
      align-items: center;
      width: 300px;
      height: 50px;
    }
    .close-webdav {
      display: flex;
      align-items: center;
      height: 50px;
    }
  }
  .finder_content {
    height: calc(100% - 50px);
    .finder_breadcrumb {
      display: flex;
      align-items: center;
      height: 30px;
      margin-top: 10px;
      margin-bottom: 10px;
      padding: 0 10px;
      border-bottom: 1px solid #d9d9d960;

      .path-router {
        overflow-x: auto;
        overflow-y: hidden;
        width: 100%;
        height: 100%;
        line-height: 100%;
      }
    }
    .finder_toolbar {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      height: 30px;
      padding: 0 10px;

      gap: 5px;
      .toolbar_left {
        flex: 1;
      }
    }
    .finder_operation {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      height: 30px;
      margin-bottom: 10px;
      padding: 0 10px;
    }
    .finder_list {
      display: flex;
      overflow-y: auto;
      align-content: flex-start;
      align-items: flex-start;
      flex-wrap: wrap;
      justify-content: flex-start;
      width: 100%;
      height: calc(100% - 90px);

      column-gap: 20px;
      row-gap: 20px;
      .list_item {
        display: flex;
        align-items: center;
        flex-direction: column;
        flex-wrap: wrap;
        justify-content: center;
        width: 130px;
        padding: 10px;
        cursor: pointer;
        user-select: none;
        border-radius: 10px;

        column-gap: 10px;
        .item_icon {
          width: 80px;
          height: 80px;
          margin-bottom: 10px;
          img {
            width: 100%;
            height: 100%;

            -webkit-user-drag: none;
            object-fit: cover;
          }
        }
        .item_name {
          overflow: hidden;
          flex: 1;
          width: 90%;
          margin-bottom: 10px;
          text-align: center;
          font-size: 16px;
        }
        .item_modified {
          width: 100%;
          text-align: center;
          font-size: 12px;
        }
        &:hover {
          background-color: rgba(99, 125, 255, 0.1);
        }
      }
      .list_item[data-is-selected='true'] {
        background-color: rgba(99, 125, 255, 0.12);
      }
      .list_item[data-is-dragging='true'] {
        opacity: 0.5;
      }
      .list_item[data-drop-target='true'] {
        border: 1px dashed #5c6ac4;
        border-radius: 10px;
        background-color: rgba(99, 125, 255, 0.12);
      }
      .move-selected-mask {
        position: absolute;
        top: 0;
        left: 0;
        opacity: 0.3;
        border: 1px dashed #d9d9d9;
        background-color: blue;
      }
    }
  }
}
</style>

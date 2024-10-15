<script setup>
import { reactive } from 'vue'
import _ from 'lodash'
import { toRaw } from 'vue'
import { message } from 'ant-design-vue'

const emits = defineEmits(['login'])

const formState = reactive({
  remoteUrl: 'http://192.168.202.120:1234',
  username: 'user',
  password: '0000'
})
const login = () => {
  window.api.webdav
    .login(formState.remoteUrl, _.omit(toRaw(formState), 'remoteUrl'))
    .then(() => {
      message.success('登录成功')
      emits('login', true)
    })
    .catch((e) => {
      message.error('登录失败：' + e.message)
      emits('login', false)
    })
}
</script>

<template>
  <div class="webdav_login">
    <a-form
      :model="formState"
      name="basic"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 24 }"
      autocomplete="off"
    >
      <a-form-item
        label="地址"
        name="remoteUrl"
        :rules="[{ required: true, message: '请输入服务器地址' }]"
      >
        <a-input v-model:value="formState.remoteUrl" placeholder="请输入服务器地址" />
      </a-form-item>
      <a-form-item
        label="用户"
        name="username"
        :rules="[{ required: true, message: '请输入用户名' }]"
      >
        <a-input v-model:value="formState.username" placeholder="请输入用户名" />
      </a-form-item>
      <a-form-item
        label="密码"
        name="password"
        :rules="[{ required: true, message: '请输入密码' }]"
      >
        <a-input-password v-model:value="formState.password" placeholder="请输入密码" />
      </a-form-item>

      <a-form-item :wrapper-col="{ offset: 8, span: 24 }">
        <a-button type="primary" @click="login">登录</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.webdav_login {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style>

import { createVNode, getCurrentInstance, render } from 'vue'
import Progress from '../components/progress.vue'
import Rename from '../components/rename.vue'
import Detail from '../components/detail.vue'
export default () => {
  const context = getCurrentInstance().appContext

  const createModalPopper = (comp, options, context) => {
    const container = document.createElement('div')
    const destroy = () => {
      render(null, container)
      container.remove()
    }
    const vNode = createVNode(
      comp,
      {
        ...options,
        onClose: destroy
      },
      null
    )
    vNode.appContext = context || getCurrentInstance().appContext
    render(vNode, container)
    const vm = vNode.component
    options.appendTo.appendChild(container)
    return {
      vm,
      vNode,
      destroy
    }
  }

  const showProgress = (options) => {
    const $options = {
      ...(options || {}),
      appendTo: options?.appendTo || document.querySelector('#app') || document.body
    }
    const { vm, destroy } = createModalPopper(Progress, $options, context)
    return {
      vm,
      destroy
    }
  }

  const showRename = (options) => {
    const $options = {
      ...(options || {}),
      appendTo: options?.appendTo || document.querySelector('#app') || document.body
    }
    const { vm, destroy } = createModalPopper(Rename, $options, context)
    return {
      vm,
      destroy
    }
  }

  const showDetail = (options) => {
    const $options = {
      ...(options || {}),
      appendTo: options?.appendTo || document.querySelector('#app') || document.body
    }
    const { vm, destroy } = createModalPopper(Detail, $options, context)
    return {
      vm,
      destroy
    }
  }

  return {
    showProgress,
    showRename,
    showDetail
  }
}

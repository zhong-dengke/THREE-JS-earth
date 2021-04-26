import Vue from 'vue'
import Router from 'vue-router'
import chartIndex from '@/components/chartIndex'


Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      redirect: '/index'
    },
    {
      path: '/index',
      name: 'index',
      component: chartIndex,
    },
    // 路由监测
    {
      path: '*',
      redirect: '/'
    }
  ]
})

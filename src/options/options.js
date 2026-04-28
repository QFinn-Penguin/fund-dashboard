import Vue from "vue";
import App from "./App";
import "./message.scss";
import axios from "axios";
import {
  Switch,
  Slider,
  Message,
  Radio,
  RadioGroup,
  Button,
  Input,
  Loading,
  Dialog
} from 'element-ui';


Vue.use(Switch)
Vue.use(Slider)
Vue.use(Radio)
Vue.use(RadioGroup)
Vue.use(Button)
Vue.use(Input)
Vue.use(Dialog)
Vue.use(Loading)

Vue.prototype.$axios = axios;
Vue.prototype.$message = Message;
Vue.prototype.$ELEMENT = { size: 'mini' };

Vue.use(Loading.directive);
Vue.prototype.$loading = Loading.service;

/* eslint-disable no-new */
new Vue({
  el: "#app",

  render: h => h(App)
});

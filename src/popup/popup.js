import Vue from "vue";
import App from "./App";
import "./popup.scss";
import axios from "axios";
import {
  Select,
  Option,
  DatePicker,
  RadioButton,
  RadioGroup,
  Dialog,
  Loading,
  Icon
} from 'element-ui';

Vue.prototype.$axios = axios;
Vue.prototype.$ELEMENT = { size: 'mini' };
Vue.use(Loading.directive);
Vue.prototype.$loading = Loading.service;

Vue.use(Select)
Vue.use(Option)
Vue.use(DatePicker)
Vue.use(RadioButton)
Vue.use(RadioGroup)
Vue.use(Dialog)
Vue.use(Loading)
Vue.use(Icon)

/* eslint-disable no-new */
new Vue({
  el: "#app",

  render: h => h(App)
});

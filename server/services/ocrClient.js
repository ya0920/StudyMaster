'use strict';
const OpenApi = require('@alicloud/openapi-client');
const Util = require('@alicloud/tea-util');
const Stream = require('@alicloud/darabonba-stream');
const Tea = require('@alicloud/tea-typescript');
require('dotenv').config();

class Client {
  static createClient() {
    let config = new OpenApi.Config({
      accessKeyId: process.env['ALIBABA_CLOUD_ACCESS_KEY_ID'],
      accessKeySecret: process.env['ALIBABA_CLOUD_ACCESS_KEY_SECRET'],
    });
    config.endpoint = `ocr-api.cn-hangzhou.aliyuncs.com`;
    return new OpenApi.default(config);
  }

  static createApiInfo() {
    let params = new OpenApi.Params({
      action: 'RecognizeEduQuestionOcr',
      version: '2021-07-07',
      protocol: 'HTTPS',
      method: 'POST',
      authType: 'AK',
      style: 'V3',
      pathname: `/`,
      reqBodyType: 'json',
      bodyType: 'json',
    });
    return params;
  }

  // 将识别功能封装为一个函数，传入文件路径并返回 OCR 结果
  static async recognize(filePath) {
    let client = Client.createClient();
    let params = Client.createApiInfo();
    let body = Stream.default.readFromFilePath(filePath);
    let runtime = new Util.RuntimeOptions({});
    let request = new OpenApi.OpenApiRequest({
      stream: body,
    });
    const response = await client.callApi(params, request, runtime);
    return response.body; // 返回 OCR 识别结果
  }
}

module.exports = Client;


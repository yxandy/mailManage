# HeroSMS 活动号码查询接口

## 用途

提供给外部程序查询当前是否存在“活动中的 HeroSMS 号码”。

如果当前至少有一条活动中的号码，接口会返回：

- 是否存在活动号码
- 最新创建的那条活动号码
- 对应的 `activationId`

如果当前没有活动中的号码，则返回空值。

## 接口地址

```text
GET /api/internal/hero-sms-active
```

线上示例：

```text
https://mailmanage.yxandy.cc.cd/api/internal/hero-sms-active
```

## 鉴权方式

接口使用 `Bearer Token` 鉴权。

请求头需要带：

```text
Authorization: Bearer <token>
```

服务端会用下面任一环境变量进行比对：

- `HME_INGEST_TOKEN`
- `EXECUTOR_TOKEN`

## 返回规则

接口内部会查询 `hero_sms_activations` 表中：

- `is_active = true`

并按：

- `created_at desc`

排序，只返回最新创建的那一条活动记录。

## 成功返回示例

### 当前存在活动号码

```json
{
  "hasActiveNumber": true,
  "phoneNumber": "447123456789",
  "activationId": "123456789"
}
```

### 当前不存在活动号码

```json
{
  "hasActiveNumber": false,
  "phoneNumber": null,
  "activationId": null
}
```

## 常见错误返回

### 鉴权失败

```json
{
  "error": "鉴权失败"
}
```

HTTP 状态码：

```text
401
```

### 服务端未配置 token

```json
{
  "error": "服务端缺少 HME_INGEST_TOKEN（或 EXECUTOR_TOKEN）配置"
}
```

HTTP 状态码：

```text
500
```

### 查询失败

```json
{
  "error": "查询失败"
}
```

HTTP 状态码：

```text
500
```

## JavaScript 调用示例

### 浏览器或支持 `fetch` 的运行环境

```js
const token = "你的 HME_INGEST_TOKEN 或 EXECUTOR_TOKEN";

async function getCurrentHeroSmsNumber() {
  const response = await fetch(
    "https://mailmanage.yxandy.cc.cd/api/internal/hero-sms-active",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `请求失败：${response.status}`);
  }

  return data;
}

async function main() {
  try {
    const result = await getCurrentHeroSmsNumber();

    if (result.hasActiveNumber) {
      console.log("当前活动号码：", result.phoneNumber);
      console.log("activationId：", result.activationId);
    } else {
      console.log("当前没有活动中的 HeroSMS 号码。");
    }
  } catch (error) {
    console.error("查询失败：", error);
  }
}

main();
```

### Node.js `fetch` 调用示例

如果运行环境是支持原生 `fetch` 的 Node.js 版本，也可以直接这样写：

```js
const token = process.env.HME_INGEST_TOKEN;

async function queryActiveHeroSms() {
  const response = await fetch(
    "https://mailmanage.yxandy.cc.cd/api/internal/hero-sms-active",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data;
}

queryActiveHeroSms()
  .then((data) => {
    if (data.hasActiveNumber) {
      console.log("号码：", data.phoneNumber);
    } else {
      console.log("暂无活动号码");
    }
  })
  .catch((error) => {
    console.error(error);
  });
```

## 调用方建议

1. 先判断 `hasActiveNumber`，再读取 `phoneNumber`。
2. 如果外部程序只关心号码本身，可以只使用 `phoneNumber`。
3. 如果后面还要结合 HeroSMS 的生命周期动作，可一并保存 `activationId`。
4. 不要把 token 写死到会公开分发的前端代码中。

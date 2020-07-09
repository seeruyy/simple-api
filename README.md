# Simple API Example

The simple API example for bank account users. 

### Url
<a href="http://ec2-52-14-199-14.us-east-2.compute.amazonaws.com/" target="_blank">**http://ec2-52-14-199-14.us-east-2.compute.amazonaws.com/**</a>

# API

### 1. Create a user
 - Path: /api/users
 - Methods: PUT
 - Allowed parameters:
  > { email: String, firstName: String, lastName: String, password: String, confirmationPassword: String }
 - Required parameters: All
 - Authentication: Public
 - Example:
```shell
$ curl -X PUT -H "Content-Type: application/json" -d '{"email":"example@email.com","firstName":"Jon","lastName":"Dough","password":"ColdPlay","confirmPassword":"ColdPlay"}' http://ec2-52-14-199-14.us-east-2.compute.amazonaws.com/api/users
 ```
  - Response:
   > **201 Created** - JSON { userId: Integer, email: String, firstName: String, lastName: String, createdAt: Date, updatedAt: Date }<br />
   > **400 Bed Request** - JSON { message: String, code: String, originalError: Array[{ message: String, code: String }] }
 
### 2. Update a user
 - Path: /api/users
 - Methods: POST
 - Allowed parameters:
  > { email: String, firstName: String, lastName: String, password: String, confirmationPassword: String }
 - Required parameters: No
 - Authentication: Basic
 - Example:
```shell
$ curl -X POST -H "Content-Type: application/json" -d '{"email":"newexample@email.com","firstName":"NewJon","lastName":"NewDough","password":"NewColdPlay","confirmPassword":"NewColdPlay"}' -u example@email.com:ColdPlay http://ec2-52-14-199-14.us-east-2.compute.amazonaws.com/api/users
 ```
 - Response:
  > **204 NO_CONTENT**<br />
  > **400 Bed Request** - JSON { message: String, code: String, originalError: Array[{ message: String, code: String }] }<br />
  > **401 Unauthorized** - JSON { message: String, code: String }<br />
  > **403 Forbidden** - JSON { message: String, code: String }

### 3. Retrive user balance
 - Path: /api/users/balance
 - Methods: GET
 - Allowed parameters: Not allowed
 - Required parameters: No
 - Authentication: Basic
 - Example:
```shell
$ curl -X GET -H "Content-Type: application/json" -u newexample@email.com:NewColdPlay http://ec2-52-14-199-14.us-east-2.compute.amazonaws.com/api/users/balance
 ```
 - Response:
  > **200 OK** - JSON { balance: Integer }<br />
  > **400 Bed Request** - JSON { message: String, code: String, originalError: Array[{ message: String, code: String }] }<br />
  > **401 Unauthorized** - JSON { message: String, code: String }<br />
  > **403 Forbidden** - JSON { message: String, code: String }

### 4. Authorize a transaction
 - Path: /api/transactions/
 - Methods: PUT
 - Allowed parameters:
  > { merchantId: Integer, amountInCents: Integer }
 - Required parameters: All
 - Authentication: Basic
 - Example:
```shell
$ curl -X PUT -H "Content-Type: application/json" -d '{"merchantId":1,"amountInCents":100}' -u newexample@email.com:NewColdPlay http://ec2-52-14-199-14.us-east-2.compute.amazonaws.com/api/transactions
 ```
 - Response:
  > **201 Created** - JSON { status: Enum[ACCEPTED | REJECTED] }<br />
  > **400 Bed Request** - JSON { message: String, code: String, originalError: Array[{ message: String, code: String }] }<br />
  > **401 Unauthorized** - JSON { message: String, code: String }<br />
  > **403 Forbidden** - JSON { message: String, code: String }

# Dependencies

To install dependencies you need to run a following command in shell

```shell
$ npm install
```


# Unit Test

To run the unit tests you need to run a following command in shell

```shell
$ npm test
```

# Run Application

To run application you need to run a following command in shell

```shell
$ npm start
```

Also there is an option to run docker env.
First create **.env** file in root directory then run a following command in shell

```shell
$ npm run launch
```
OR
```shell
$ docker-compose up --build --force-recreate -d
```

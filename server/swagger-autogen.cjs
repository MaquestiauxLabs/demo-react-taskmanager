const swaggerAutogen = require("swagger-autogen");
const express = require("express");

const doc = {
  info: {
    title: "Task Manager API",
    version: "1.0.0",
    description: "API for React Task Manager",
  },
  host: "localhost:3000",
  basePath: "/",
  schemes: ["http"],
  consumes: ["application/json"],
  produces: ["application/json"],
  definitions: {
    StandardResponse: {
      type: "object",
      properties: {
        httpStatus: { type: "number" },
        message: { type: "string" },
        data: { type: "object" },
        error: { type: "object" },
        pagination: {
          type: "object",
          properties: {
            page: { type: "number" },
            pageSize: { type: "number" },
            totalItems: { type: "number" },
            totalPages: { type: "number" },
          },
        },
      },
      required: ["httpStatus", "message"],
    },
    User: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        email: { type: "string" },
        givenName: { type: "string" },
        familyName: { type: "string" },
        avatarUrl: { type: "string" },
        roleId: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
      },
    },
    CreateUserInput: {
      type: "object",
      properties: {
        name: { type: "string" },
        givenName: { type: "string" },
        familyName: { type: "string" },
        email: { type: "string" },
        avatarUrl: { type: "string" },
        roleId: { type: "string" },
      },
    },
    UpdateUserInput: {
      type: "object",
      properties: {
        name: { type: "string" },
        givenName: { type: "string" },
        familyName: { type: "string" },
        email: { type: "string" },
        avatarUrl: { type: "string" },
        roleId: { type: "string" },
      },
    },
  },
};

const outputFile = "./swagger.json";

const routes = {
  // Users
  "/api/users": {
    get: {
      tags: ["Users"],
      summary: "Get all users",
      responses: {
        200: {
          description: "OK",
          schema: { $ref: "#/definitions/StandardResponse" },
        },
      },
    },
    post: {
      tags: ["Users"],
      summary: "Create a new user",
      parameters: [
        {
          in: "body",
          name: "body",
          schema: { $ref: "#/definitions/CreateUserInput" },
        },
      ],
      responses: {
        201: {
          description: "Created",
          schema: { $ref: "#/definitions/StandardResponse" },
        },
      },
    },
  },
  "/api/users/{id}": {
    get: {
      tags: ["Users"],
      summary: "Get user by ID",
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          type: "string",
        },
      ],
      responses: {
        200: {
          description: "OK",
          schema: { $ref: "#/definitions/StandardResponse" },
        },
      },
    },
    put: {
      tags: ["Users"],
      summary: "Update user",
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          type: "string",
        },
        {
          in: "body",
          name: "body",
          schema: { $ref: "#/definitions/UpdateUserInput" },
        },
      ],
      responses: {
        200: {
          description: "OK",
          schema: { $ref: "#/definitions/StandardResponse" },
        },
      },
    },
    delete: {
      tags: ["Users"],
      summary: "Delete user",
      parameters: [
        {
          in: "path",
          name: "id",
          required: true,
          type: "string",
        },
      ],
      responses: {
        200: {
          description: "OK",
          schema: { $ref: "#/definitions/StandardResponse" },
        },
      },
    },
  },
};

swaggerAutogen(outputFile, [], doc, routes).then(() => {
  console.log("Swagger specification generated!");
});

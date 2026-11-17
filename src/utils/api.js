const {
  ForeignKeyConstraintError,
  UniqueConstraintError,
  ValidationError
} = require('sequelize');

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isId(value) {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value > 0;
  }

  return typeof value === 'string' && /^[1-9]\d*$/.test(value);
}

function pickFields(source, fields) {
  return fields.reduce((result, field) => {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      result[field] = source[field];
    }

    return result;
  }, {});
}

function errorResponse(error, res, action, duplicateMessage) {
  if (error instanceof UniqueConstraintError) {
    return res.status(409).json({
      mensagem: duplicateMessage || 'Já existe um registro com esses dados.'
    });
  }

  if (error instanceof ForeignKeyConstraintError) {
    return res.status(409).json({
      mensagem: 'A operação viola um relacionamento existente.'
    });
  }

  if (error instanceof ValidationError) {
    return res.status(400).json({
      mensagem: 'Os dados informados são inválidos.'
    });
  }

  const detalhes = { tipo: error.name };
  if (error.original && error.original.code) {
    detalhes.codigo = error.original.code;
  }
  console.error(`Erro ao ${action}:`, detalhes);

  return res.status(500).json({
    mensagem: `Erro interno ao ${action}.`
  });
}

module.exports = {
  errorResponse,
  isId,
  isObject,
  pickFields
};

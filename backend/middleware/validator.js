const { body, validationResult } = require('express-validator');

// Middleware para validar resultados
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({ 
      error: firstError.msg || 'Dados invalidos',
      message: firstError.msg || 'Por favor, verifique os dados informados.',
      details: errors.array(),
      code: 'VALIDACAO_FALHOU'
    });
  }
  next();
};

// Sanitizacao de strings para prevenir XSS
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Validacoes comuns
const loginValidation = [
  body('cpf')
    .notEmpty()
    .withMessage('CPF é obrigatório')
    .trim()
    .custom((value) => {
      // Remover caracteres não numéricos
      const cpfLimpo = value.replace(/\D/g, '');
      // Validar que tem 11 dígitos
      if (cpfLimpo.length !== 11) {
        throw new Error('CPF deve ter 11 dígitos');
      }
      return true;
    }),
  body('senha')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter no minimo 6 caracteres')
    .trim(),
  validate
];

const registerValidation = [
  body('nome')
    .isLength({ min: 3, max: 100 })
    .withMessage('Nome deve ter entre 3 e 100 caracteres')
    .trim()
    .escape(),
  body('email')
    .isEmail()
    .withMessage('Email invalido')
    .normalizeEmail()
    .trim()
    .escape(),
  body('senha')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter no minimo 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter letras maiusculas, minusculas e numeros')
    .trim(),
  validate
];

const embarcacaoValidation = [
  body('nome')
    .isLength({ min: 3, max: 200 })
    .withMessage('Nome da embarcacao deve ter entre 3 e 200 caracteres')
    .trim()
    .escape(),
  body('tipo')
    .isLength({ min: 2, max: 100 })
    .withMessage('Tipo invalido')
    .trim()
    .escape(),
  body('modelo')
    .optional()
    .trim()
    .escape(),
  body('ano_fabricacao')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage('Ano de fabricacao invalido'),
  body('tamanho_pes')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tamanho em pes deve ser positivo'),
  body('proprietario_nome')
    .optional()
    .trim()
    .escape(),
  body('proprietario_cpf')
    .optional()
    .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/)
    .withMessage('CPF invalido'),
  validate
];

const vistoriaValidation = [
  body('embarcacao_id')
    .isInt()
    .withMessage('ID da embarcacao invalido'),
  body('local_id')
    .isInt()
    .withMessage('ID do local invalido'),
  body('vistoriador_id')
    .isInt()
    .withMessage('ID do vistoriador invalido'),
  body('data_vistoria')
    .isISO8601()
    .withMessage('Data invalida'),
  body('observacoes')
    .optional()
    .trim()
    .escape(),
  validate
];

const laudoValidation = [
  body('vistoria_id')
    .isInt()
    .withMessage('ID da vistoria invalido'),
  body('numero_laudo')
    .optional()
    .trim()
    .escape(),
  body('versao')
    .optional()
    .trim()
    .escape(),
  validate
];

module.exports = {
  validate,
  sanitizeString,
  loginValidation,
  registerValidation,
  embarcacaoValidation,
  vistoriaValidation,
  laudoValidation
};



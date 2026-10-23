import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';

import {
  emailLoginSchema,
  emailSchema,
  emailSignUpSchema,
  fullNameSchema,
  normalizePhone,
  otpSchema,
  phoneSignUpSchema,
  validate,
} from '../src/lib/auth/schemas.ts';

test('Phone number normalization and E.164 formatting', async (t: TestContext) => {
  await t.test('normalizes 9-digit Cameroonian mobile numbers starting with 6', () => {
    assert.equal(normalizePhone('671234567'), '+237671234567');
    assert.equal(normalizePhone('699887766'), '+237699887766');
    assert.equal(normalizePhone('6 55 12 34 56'), '+237655123456');
    assert.equal(normalizePhone('6-80-11-22-33'), '+237680112233');
  });

  await t.test('normalizes Cameroonian landline numbers starting with 2', () => {
    assert.equal(normalizePhone('222123456'), '+237222123456');
    assert.equal(normalizePhone('242001122'), '+237242001122');
  });

  await t.test('preserves valid international E.164 formats', () => {
    assert.equal(normalizePhone('+237671234567'), '+237671234567');
    assert.equal(normalizePhone('+14155552671'), '+14155552671');
    assert.equal(normalizePhone('+33612345678'), '+33612345678');
  });

  await t.test('converts 00-prefixed international dial codes to E.164 (+)', () => {
    assert.equal(normalizePhone('00237671234567'), '+237671234567');
    assert.equal(normalizePhone('0014155552671'), '+14155552671');
  });

  await t.test('rejects malformed, short, or invalid characters', () => {
    assert.equal(normalizePhone('12345'), null);
    assert.equal(normalizePhone('abc671234567'), null);
    assert.equal(normalizePhone(''), null);
    assert.equal(normalizePhone('+0123456789'), null);
  });
});

test('Input validation schemas', async (t: TestContext) => {
  await t.test('validates and normalizes email addresses', () => {
    const valid = emailSchema.parse('  User.Name+Tag@Example.COM ');
    assert.equal(valid, 'user.name+tag@example.com');

    assert.throws(() => emailSchema.parse('not-an-email'));
    assert.throws(() => emailSchema.parse('@missing-user.com'));
    assert.throws(() => emailSchema.parse('user@'));
    assert.throws(() => emailSchema.parse('a'.repeat(255) + '@example.com'));
  });

  await t.test('validates full names with international/African accents and length bounds', () => {
    assert.equal(fullNameSchema.parse('Tchinda René'), 'Tchinda René');
    assert.equal(fullNameSchema.parse("N'Golo Kanté"), "N'Golo Kanté");
    assert.equal(fullNameSchema.parse('Jean-Baptiste'), 'Jean-Baptiste');
    assert.equal(fullNameSchema.parse('Aboubakar Oumarou'), 'Aboubakar Oumarou');

    assert.throws(() => fullNameSchema.parse('A'));
    assert.throws(() => fullNameSchema.parse('A'.repeat(81)));
    assert.throws(() => fullNameSchema.parse('<script>alert(1)</script>'));
    assert.throws(() => fullNameSchema.parse('123456'));
  });

  await t.test('validates 6-digit OTP codes strictly', () => {
    assert.deepEqual(otpSchema.parse({ code: ' 123456 ' }), { code: '123456' });

    assert.throws(() => otpSchema.parse({ code: '12345' }));
    assert.throws(() => otpSchema.parse({ code: '1234567' }));
    assert.throws(() => otpSchema.parse({ code: '12345a' }));
    assert.throws(() => otpSchema.parse({ code: '' }));
  });
});

test('Form validation error mapping', async () => {
  const emailResult = validate(emailLoginSchema, { email: 'invalid' });
  assert.equal(emailResult.success, false);
  if (!emailResult.success) {
    assert.ok(emailResult.errors.email);
  }

  const phoneResult = validate(phoneSignUpSchema, {
    fullName: 'Bob',
    phone: 'invalid-phone',
  });
  assert.equal(phoneResult.success, false);
  if (!phoneResult.success) {
    assert.ok(phoneResult.errors.phone);
  }

  const successResult = validate(emailSignUpSchema, {
    fullName: 'Amadou Bello',
    email: 'amadou@example.cm',
  });
  assert.equal(successResult.success, true);
  if (successResult.success) {
    assert.equal(successResult.data.fullName, 'Amadou Bello');
    assert.equal(successResult.data.email, 'amadou@example.cm');
  }
});

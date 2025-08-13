exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('name');
    table.string('phone');
    table.enum('subscription', ['FREE', 'PRO', 'ELITE']).defaultTo('FREE');
    table.timestamp('subscription_expires_at');
    table.json('api_keys').defaultTo('{}');
    table.boolean('two_factor_enabled').defaultTo(false);
    table.string('two_factor_secret');
    table.boolean('biometric_enabled').defaultTo(false);
    table.string('referral_code').unique();
    table.integer('referral_count').defaultTo(0);
    table.string('referred_by');
    table.json('preferences').defaultTo('{}');
    table.enum('risk_profile', ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE']);
    table.json('tax_settings').defaultTo('{}');
    table.boolean('kyc_verified').defaultTo(false);
    table.json('kyc_data').defaultTo('{}');
    table.boolean('email_verified').defaultTo(false);
    table.string('email_verification_token');
    table.string('password_reset_token');
    table.timestamp('password_reset_expires');
    table.timestamp('last_login');
    table.string('last_ip');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    table.index(['email']);
    table.index(['referral_code']);
    table.index(['subscription']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
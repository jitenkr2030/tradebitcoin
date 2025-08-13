exports.up = function(knex) {
  return Promise.all([
    // Backtests table
    knex.schema.createTable('backtests', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('strategy_id').references('id').inTable('trading_strategies').onDelete('CASCADE');
      table.timestamp('start_date').notNullable();
      table.timestamp('end_date').notNullable();
      table.decimal('initial_balance', 20, 8).notNullable();
      table.decimal('final_balance', 20, 8).notNullable();
      table.integer('total_trades').defaultTo(0);
      table.decimal('win_rate', 8, 4).defaultTo(0);
      table.decimal('profit_loss_percent', 8, 4).defaultTo(0);
      table.json('metrics').defaultTo('{}');
      table.json('settings').defaultTo('{}');
      table.json('results').defaultTo('{}');
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['strategy_id']);
    }),

    // Alerts table
    knex.schema.createTable('alerts', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.enum('type', ['PRICE', 'VOLUME', 'WHALE', 'NEWS', 'PORTFOLIO', 'PANIC']).notNullable();
      table.string('title').notNullable();
      table.text('message').notNullable();
      table.string('symbol');
      table.string('condition');
      table.decimal('target_value', 20, 8);
      table.decimal('current_value', 20, 8);
      table.boolean('triggered').defaultTo(false);
      table.timestamp('triggered_at');
      table.enum('priority', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).defaultTo('MEDIUM');
      table.json('notification_channels').defaultTo('{}');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['type']);
      table.index(['triggered']);
    }),

    // Journal entries table
    knex.schema.createTable('journal_entries', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('trade_id').references('id').inTable('trades').onDelete('SET NULL');
      table.enum('type', ['ENTRY', 'EXIT', 'NOTE', 'ANALYSIS']).notNullable();
      table.text('content').notNullable();
      table.enum('sentiment', ['POSITIVE', 'NEGATIVE', 'NEUTRAL']).defaultTo('NEUTRAL');
      table.json('tags').defaultTo('[]');
      table.json('attachments').defaultTo('[]');
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['type']);
      table.index(['created_at']);
    }),

    // Tax reports table
    knex.schema.createTable('tax_reports', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('tax_year').notNullable();
      table.decimal('total_gains', 20, 8).defaultTo(0);
      table.decimal('total_losses', 20, 8).defaultTo(0);
      table.decimal('net_gains', 20, 8).defaultTo(0);
      table.decimal('short_term_gains', 20, 8).defaultTo(0);
      table.decimal('long_term_gains', 20, 8).defaultTo(0);
      table.decimal('tax_liability', 20, 8).defaultTo(0);
      table.json('transactions').defaultTo('[]');
      table.string('report_file_path');
      table.enum('status', ['GENERATING', 'COMPLETED', 'FAILED']).defaultTo('GENERATING');
      table.timestamps(true, true);
      
      table.unique(['user_id', 'tax_year']);
      table.index(['user_id']);
      table.index(['tax_year']);
    }),

    // DeFi positions table
    knex.schema.createTable('defi_positions', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('protocol').notNullable();
      table.enum('type', ['LENDING', 'STAKING', 'YIELD_FARMING', 'LIQUIDITY_POOL']).notNullable();
      table.string('symbol').notNullable();
      table.decimal('amount', 20, 8).notNullable();
      table.decimal('apy', 8, 4).notNullable();
      table.decimal('current_value', 20, 8).notNullable();
      table.decimal('rewards_earned', 20, 8).defaultTo(0);
      table.timestamp('start_date').notNullable();
      table.string('network').notNullable();
      table.string('transaction_hash');
      table.json('metadata').defaultTo('{}');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['protocol']);
      table.index(['type']);
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTable('defi_positions'),
    knex.schema.dropTable('tax_reports'),
    knex.schema.dropTable('journal_entries'),
    knex.schema.dropTable('alerts'),
    knex.schema.dropTable('backtests')
  ]);
};
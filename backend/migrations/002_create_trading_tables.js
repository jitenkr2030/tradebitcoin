exports.up = function(knex) {
  return Promise.all([
    // Trading strategies table
    knex.schema.createTable('trading_strategies', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('name').notNullable();
      table.text('description');
      table.enum('type', ['SCALPING', 'SWING', 'TREND_FOLLOWING', 'ARBITRAGE', 'DCA']).notNullable();
      table.decimal('stop_loss', 8, 4).notNullable();
      table.decimal('take_profit', 8, 4).notNullable();
      table.boolean('trailing_stop').defaultTo(false);
      table.decimal('trailing_stop_distance', 8, 4);
      table.decimal('entry_threshold', 8, 4);
      table.decimal('exit_threshold', 8, 4);
      table.enum('order_type', ['SPOT', 'MARGIN', 'FUTURES']).defaultTo('SPOT');
      table.decimal('leverage', 8, 2);
      table.decimal('margin', 12, 2);
      table.enum('risk_level', ['LOW', 'MEDIUM', 'HIGH']).defaultTo('MEDIUM');
      table.decimal('max_drawdown', 8, 4);
      table.json('indicators').defaultTo('{}');
      table.json('diversification').defaultTo('{}');
      table.json('notifications').defaultTo('{}');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['type']);
    }),

    // Trades table
    knex.schema.createTable('trades', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('strategy_id').references('id').inTable('trading_strategies').onDelete('SET NULL');
      table.enum('type', ['BUY', 'SELL']).notNullable();
      table.string('symbol').notNullable();
      table.decimal('price', 20, 8).notNullable();
      table.decimal('amount', 20, 8).notNullable();
      table.decimal('total', 20, 8).notNullable();
      table.decimal('fee', 20, 8).defaultTo(0);
      table.string('exchange').notNullable();
      table.enum('order_type', ['SPOT', 'MARGIN', 'FUTURES', 'OCO']).defaultTo('SPOT');
      table.decimal('leverage', 8, 2);
      table.decimal('margin', 20, 8);
      table.decimal('stop_loss', 20, 8);
      table.decimal('take_profit', 20, 8);
      table.json('indicators');
      table.decimal('sentiment_score', 5, 4);
      table.string('external_order_id');
      table.enum('status', ['PENDING', 'FILLED', 'CANCELLED', 'FAILED']).defaultTo('PENDING');
      table.text('notes');
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['symbol']);
      table.index(['exchange']);
      table.index(['status']);
      table.index(['created_at']);
    }),

    // Portfolio table
    knex.schema.createTable('portfolio', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('symbol').notNullable();
      table.decimal('amount', 20, 8).notNullable();
      table.decimal('avg_price', 20, 8).notNullable();
      table.decimal('current_price', 20, 8).notNullable();
      table.decimal('total_value', 20, 8).notNullable();
      table.decimal('profit_loss', 20, 8).defaultTo(0);
      table.decimal('profit_loss_percent', 8, 4).defaultTo(0);
      table.decimal('allocation_percent', 8, 4).defaultTo(0);
      table.string('exchange').notNullable();
      table.decimal('roi', 8, 4).defaultTo(0);
      table.decimal('volatility_score', 8, 4).defaultTo(0);
      table.timestamps(true, true);
      
      table.unique(['user_id', 'symbol', 'exchange']);
      table.index(['user_id']);
      table.index(['symbol']);
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTable('portfolio'),
    knex.schema.dropTable('trades'),
    knex.schema.dropTable('trading_strategies')
  ]);
};
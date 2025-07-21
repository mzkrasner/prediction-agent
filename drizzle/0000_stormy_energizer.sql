CREATE TABLE "market_intelligence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_id" varchar(100) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"end_date" timestamp with time zone,
	"research_context" jsonb NOT NULL,
	"sentiment_analysis" jsonb NOT NULL,
	"technical_signals" jsonb NOT NULL,
	"confidence" integer NOT NULL,
	"sentiment_score" numeric(5, 4),
	"current_price" numeric(18, 6),
	"liquidity" numeric(18, 2),
	"volume_24h" numeric(18, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performance_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"total_trades" integer NOT NULL,
	"winning_trades" integer NOT NULL,
	"total_pnl" numeric(18, 6),
	"signal_performance" jsonb,
	"strategy_effectiveness" jsonb,
	"max_drawdown" numeric(18, 6),
	"sharpe_ratio" numeric(8, 4),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trade_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_id" varchar(100) NOT NULL,
	"action" text NOT NULL,
	"outcome" text,
	"planned_amount" numeric(18, 6),
	"actual_amount" numeric(18, 6),
	"confidence" integer NOT NULL,
	"reasoning" text NOT NULL,
	"signal_attribution" jsonb,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"transaction_hash" text,
	"execution_price" numeric(18, 6),
	"stop_loss" numeric(18, 6),
	"take_profit" numeric(18, 6),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_market_intelligence_market_id" ON "market_intelligence" USING btree ("market_id");--> statement-breakpoint
CREATE INDEX "idx_market_intelligence_created_at" ON "market_intelligence" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_market_intelligence_confidence" ON "market_intelligence" USING btree ("confidence");--> statement-breakpoint
CREATE INDEX "idx_market_intelligence_end_date" ON "market_intelligence" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "idx_performance_metrics_period" ON "performance_metrics" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "idx_performance_metrics_created_at" ON "performance_metrics" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_trade_decisions_market_id" ON "trade_decisions" USING btree ("market_id");--> statement-breakpoint
CREATE INDEX "idx_trade_decisions_status" ON "trade_decisions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_trade_decisions_created_at" ON "trade_decisions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_trade_decisions_confidence" ON "trade_decisions" USING btree ("confidence");
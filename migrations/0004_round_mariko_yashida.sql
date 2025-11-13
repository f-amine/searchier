CREATE TABLE "store_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"store_id" text NOT NULL,
	"store_name" text NOT NULL,
	"store_domain" text,
	"script_url" text NOT NULL,
	"script_tag" text NOT NULL,
	"installed" boolean DEFAULT false NOT NULL,
	"installed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "store_config" ADD CONSTRAINT "store_config_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "store_config_user_store_idx" ON "store_config" USING btree ("user_id","store_id");
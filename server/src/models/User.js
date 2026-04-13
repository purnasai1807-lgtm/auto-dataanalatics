import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { cloneRecord, createRecordId, matchRecord, nowIsoString, readOnlyStore, withStore } from "../store/fileStore.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },
    plan: {
      type: String,
      enum: ["free", "pro"],
      default: "free"
    },
    reportsUsed: {
      type: Number,
      default: 0
    },
    usageWindowStartedAt: {
      type: Date,
      default: Date.now
    },
    totalReportsGenerated: {
      type: Number,
      default: 0
    },
    onboardingCompleted: {
      type: Boolean,
      default: false
    },
    stripeCustomerId: {
      type: String,
      default: null
    },
    stripeSubscriptionId: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre("save", async function savePassword(next) {
  if (!this.isModified("password")) {
    next();
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const mongoUserModel = mongoose.model("User", userSchema);

const useMongoStore = Boolean(env.MONGODB_URI && !["disabled", "false", "none"].includes(env.MONGODB_URI.toLowerCase()));

class FileUserDocument {
  constructor(record, includePassword = false) {
    this._id = record._id;
    this.name = record.name;
    this.email = record.email;
    this.plan = record.plan;
    this.reportsUsed = record.reportsUsed ?? 0;
    this.usageWindowStartedAt = new Date(record.usageWindowStartedAt ?? Date.now());
    this.totalReportsGenerated = record.totalReportsGenerated ?? 0;
    this.onboardingCompleted = Boolean(record.onboardingCompleted);
    this.stripeCustomerId = record.stripeCustomerId ?? null;
    this.stripeSubscriptionId = record.stripeSubscriptionId ?? null;
    this.createdAt = new Date(record.createdAt ?? Date.now());
    this.updatedAt = new Date(record.updatedAt ?? Date.now());
    this.__passwordHash = record.password;

    if (includePassword) {
      this.password = record.password;
    }
  }

  get id() {
    return this._id;
  }

  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.__passwordHash);
  }

  async save() {
    const nextPasswordHash =
      typeof this.password === "string" && this.password !== this.__passwordHash
        ? await bcrypt.hash(this.password, 12)
        : this.__passwordHash;

    const persisted = await withStore((store) => {
      const index = store.users.findIndex((item) => String(item._id) === String(this._id));

      if (index === -1) {
        throw new Error("User not found.");
      }

      const nextRecord = {
        _id: this._id,
        name: this.name,
        email: this.email.toLowerCase(),
        password: nextPasswordHash,
        plan: this.plan,
        reportsUsed: this.reportsUsed ?? 0,
        usageWindowStartedAt: new Date(this.usageWindowStartedAt ?? Date.now()).toISOString(),
        totalReportsGenerated: this.totalReportsGenerated ?? 0,
        onboardingCompleted: Boolean(this.onboardingCompleted),
        stripeCustomerId: this.stripeCustomerId ?? null,
        stripeSubscriptionId: this.stripeSubscriptionId ?? null,
        createdAt: new Date(this.createdAt ?? Date.now()).toISOString(),
        updatedAt: nowIsoString()
      };

      store.users[index] = nextRecord;
      return cloneRecord(nextRecord);
    });

    this.__passwordHash = persisted.password;
    this.updatedAt = new Date(persisted.updatedAt);

    if (typeof this.password === "string") {
      this.password = persisted.password;
    }

    return this;
  }
}

class FileUserQuery {
  constructor(query) {
    this.query = query;
    this.includePassword = false;
  }

  select(selection) {
    this.includePassword = typeof selection === "string" && selection.includes("+password");
    return this;
  }

  async exec() {
    const record = await readOnlyStore((store) => store.users.find((item) => matchRecord(item, this.query)) ?? null);
    return record ? new FileUserDocument(record, this.includePassword) : null;
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }
}

const fileUserModel = {
  findOne(query) {
    return new FileUserQuery(query);
  },
  async findById(id) {
    const record = await readOnlyStore((store) => store.users.find((item) => String(item._id) === String(id)) ?? null);
    return record ? new FileUserDocument(record) : null;
  },
  async create(data) {
    const passwordHash = await bcrypt.hash(data.password, 12);
    const createdAt = nowIsoString();
    const record = await withStore((store) => {
      const nextRecord = {
        _id: createRecordId(),
        name: data.name,
        email: data.email.toLowerCase(),
        password: passwordHash,
        plan: data.plan ?? "free",
        reportsUsed: data.reportsUsed ?? 0,
        usageWindowStartedAt: new Date(data.usageWindowStartedAt ?? Date.now()).toISOString(),
        totalReportsGenerated: data.totalReportsGenerated ?? 0,
        onboardingCompleted: Boolean(data.onboardingCompleted),
        stripeCustomerId: data.stripeCustomerId ?? null,
        stripeSubscriptionId: data.stripeSubscriptionId ?? null,
        createdAt,
        updatedAt: createdAt
      };

      store.users.push(nextRecord);
      return cloneRecord(nextRecord);
    });

    return new FileUserDocument(record);
  },
  async findByIdAndUpdate(id, patch) {
    const record = await withStore((store) => {
      const index = store.users.findIndex((item) => String(item._id) === String(id));

      if (index === -1) {
        return null;
      }

      store.users[index] = {
        ...store.users[index],
        ...patch,
        updatedAt: nowIsoString()
      };

      return cloneRecord(store.users[index]);
    });

    return record ? new FileUserDocument(record) : null;
  },
  async findOneAndUpdate(query, patch) {
    const record = await withStore((store) => {
      const index = store.users.findIndex((item) => matchRecord(item, query));

      if (index === -1) {
        return null;
      }

      store.users[index] = {
        ...store.users[index],
        ...patch,
        updatedAt: nowIsoString()
      };

      return cloneRecord(store.users[index]);
    });

    return record ? new FileUserDocument(record) : null;
  },
  async deleteOne(query) {
    await withStore((store) => {
      const index = store.users.findIndex((item) => matchRecord(item, query));

      if (index !== -1) {
        store.users.splice(index, 1);
      }
    });
  }
};

export const User = useMongoStore ? mongoUserModel : fileUserModel;

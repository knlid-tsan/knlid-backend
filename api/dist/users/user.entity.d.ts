export declare enum Specialization {
    REALTOR = "realtor",
    MORTGAGE_BROKER = "mortgage",
    LAWYER = "lawyer"
}
export declare enum UserStatus {
    NEW = "new",
    PENDING = "pending",
    ACTIVE = "active",
    BLOCKED = "blocked"
}
export declare class User {
    id: string;
    phone: string;
    full_name: string;
    specialization: Specialization;
    city: string;
    status: UserStatus;
    identity_doc_url: string;
    rating: number;
    leads_sent: number;
    leads_received: number;
    leads_closed: number;
    language: string;
    created_at: Date;
    updated_at: Date;
}

```mermaid
erDiagram
    User {
        String id PK
        String email UK
        String passwordHash
        UserRole role
        String firstName NULL
        String lastName NULL
        String phoneNumber UK_NULL
        String language NULL
        String timezone NULL
        Boolean twoFactorEnabled
        String twoFactorSecret NULL
        Int failedLoginAttempts
        DateTime lastLoginAt NULL
        Boolean isActive
        AccountStatus accountStatus
        Boolean privacyConsent
        DateTime consentGivenAt NULL
        DateTime createdAt
        DateTime updatedAt
        string attributes NULL
        String defaultCurrency NULL
        DateTime lastActivityAt NULL
        Int loyaltyPoints
    }

    UserAudit {
        String id PK
        String userId FK
        String operation
        String changedBy FK_NULL
        string changes NULL
        String ipAddress NULL
        String userAgent NULL
        DateTime timestamp
    }

    Address {
        String id PK
        String userId FK
        String label NULL
        String street
        String city
        String state
        String postalCode
        String country
        Boolean isDefault
        DateTime createdAt
        DateTime updatedAt
        String tenantId FK
    }

    Wishlist {
        String id PK
        String userId FK
        String menuItemId FK
        DateTime createdAt
        UK(userId, menuItemId)
    }

    Restaurant {
        String id PK
        String name
        String imageUrl
        String restaurantPageUrl NULL
        Int productCount
        Int salesCount
        String phone
        String email
        String address
        String description
        DateTime createdAt
        String ownerId FK
        Boolean isActive
        String timezone
        String currency
        string location
        string businessHours
        String brandId FK_NULL
        string theme NULL
        Float rating
        Int ratingCount
        string deliveryFeeStructure NULL
    }

    Brand {
        String id PK
        String name
        String logoUrl
        String description NULL
        String websiteUrl NULL
        Boolean isActive
        DateTime createdAt
        DateTime updatedAt
        String tenantId FK
    }

    Category {
        String id PK
        String name
        String slug UK
        String description NULL
        String imageUrl NULL
        Boolean isActive
        Int order
        String parentId FK_NULL
        Float discountPercentage NULL
        DateTime createdAt
        DateTime updatedAt
    }

    MenuItem {
        String id PK
        String title
        String description NULL
        String sku UK
        Float finalPrice
        Float mrp
        Float discountPercentage
        InventoryStatus stockStatus
        Float rating
        Int ratingCount
        DateTime createdAt
        DateTime updatedAt
        String restaurantId FK
        Boolean isActive
        String categoryId FK
        String currency
        String lastUpdatedBy FK
        string availabilitySchedule NULL
        Int prepTime NULL
        Boolean isFeatured
        Int maxOrderQuantity NULL
        Int minOrderQuantity
        string allergens NULL
        string nutritionInfo NULL
        String tenantId FK
        DateTime deletedAt NULL
        String brandId FK_NULL
        String color NULL
        WeightUnit weightUnit
        Boolean isVisible
        string searchKeywords NULL
        String taxRateId FK_NULL
        String dietaryLabel NULL
        String quantityLabel NULL
        String[] flags
        String dealSectionId FK_NULL
        String newArrivalsSectionId FK_NULL
        String tabId FK_NULL
    }

    MenuItemAudit {
        String id PK
        String menuItemId FK
    }

    MenuItemVariant {
        String id PK
        String menuItemId FK
        String weight
        Boolean isActive
        DateTime createdAt
    }

    MenuItemImage {
        String id PK
        String menuItemId FK
        String imageUrl
        Boolean isPrimary
        DateTime createdAt
        String altText NULL
        Int order
    }

    MenuItemSpecification {
        String id PK
        String menuItemId FK
        String specKey
        String specValue
        DateTime createdAt
    }

    MenuItemAttribute {
        String id PK
        String menuItemId FK
        String key
        string value
        String language NULL
    }

    MenuItemPriceHistory {
        String id PK
        String menuItemId FK
        String variantId FK_NULL
        Float finalPrice
        Float mrp
        Float discountPercentage
        DateTime effectiveFrom
        DateTime effectiveUntil NULL
        DateTime createdAt
    }

    MenuItemReview {
        String id PK
        String menuItemId FK
        String userId FK
        String userName
        String userImageUrl NULL
        Float rating
        String comment
        DateTime createdAt
    }

    RelatedMenuItem {
        String id PK
        String menuItemId FK "Source"
        String relatedItemId FK "Target"
        DateTime createdAt
        UK(menuItemId, relatedItemId)
    }

    Tag {
        String id PK
        String name
        String slug UK
        String description NULL
        String type
        DateTime createdAt
        DateTime updatedAt
    }

    Menu {
        String id PK
        String restaurantId FK
        String name
        String description NULL
        Boolean isActive
        DateTime startTime NULL
        DateTime endTime NULL
        DateTime createdAt
        DateTime updatedAt
        String tenantId FK
    }

    MenuItemsOnMenus {
        String menuItemId PK FK
        String menuId PK FK
        DateTime assignedAt
        Int order NULL
    }

    MenuItemRecommendation {
        String id PK
        String sourceMenuItemId FK
        String targetMenuItemId FK
        RecommendationReason reason
        Float score NULL
        DateTime createdAt
        UK(sourceMenuItemId, targetMenuItemId)
    }

    Order {
        String id PK
        String userId FK
        String restaurantId FK
        OrderStatus status
        PaymentStatus paymentStatus
        Float subtotal
        Float tax
        Float deliveryFee
        Float discount
        Float total
        String notes NULL
        string deliveryAddress NULL
        DateTime estimatedDeliveryTime NULL
        DateTime actualDeliveryTime NULL
        String cancelReason NULL
        DateTime createdAt
        DateTime updatedAt
        OrderType orderType
        String deliveryInstructions NULL
        String source NULL
        PriorityLevel priority NULL
        String correlationId UK
        String tenantId FK
    }

    OrderItem {
        String id PK
        String orderId FK
        String menuItemId FK
        Int quantity
        Float unitPrice
        Float subtotal
        String notes NULL
    }

    OrderAudit {
        String id PK
        String orderId FK
        String operation
        String changedBy FK
        string changes
        DateTime timestamp
    }

    Payment {
        String id PK
        String orderId FK
        Float amount
        String currency
        PaymentMethod method
        PaymentStatus status
        String transactionId UK_NULL
        string gatewayResponse NULL
        ReturnStatus refundStatus NULL
        DateTime createdAt
        DateTime updatedAt
    }

    Delivery {
        String id PK
        String orderId UK FK
        String driverId FK_NULL
        DeliveryStatus status
        String trackingUrl NULL
        DateTime assignedAt NULL
        DateTime pickedUpAt NULL
        DateTime completedAt NULL
        String tenantId FK
        DateTime createdAt
    }

    Driver {
        String id PK
        String userId UK FK
        string vehicleInfo NULL
        Boolean isActive
        DateTime createdAt
        DateTime updatedAt
        String tenantId FK
    }

    OrderCancellation {
        String id PK
        String orderId FK
        String reason
        String requestedBy FK
        String approvedBy FK_NULL
        OrderCancellationStatus status
        DateTime createdAt
    }

    Allergen {
        String id PK
        String name UK
        String description NULL
        DateTime createdAt
        DateTime updatedAt
        String tenantId FK
    }

    MenuItemAllergen {
        String menuItemId PK FK
        String allergenId PK FK
        DateTime createdAt
    }

    TaxRate {
        String id PK
        String name
        Float rate
        String region NULL
        DateTime effectiveFrom
        Boolean isActive
        String restaurantId FK_NULL
        String tenantId FK
        DateTime createdAt
        DateTime updatedAt
    }

    Notification {
        String id PK
        String userId FK
        NotificationType type
        NotificationChannel channel
        String title
        String message
        Boolean isRead
        DateTime readAt NULL
        string metadata NULL
        DateTime createdAt
        String tenantId FK
    }

    Feedback {
        String id PK
        String orderId FK
        String userId FK
        FeedbackType type
        String comment NULL
        Int rating
        DateTime createdAt
        String tenantId FK
    }

    LoyaltyProgram {
        String id PK
        String name
        String description NULL
        Float pointsPerDollar
        Int rewardThreshold
        String rewardType
        Float rewardValue NULL
        Boolean isActive
        DateTime validFrom NULL
        DateTime validUntil NULL
        DateTime createdAt
        DateTime updatedAt
        String tenantId FK
    }

    LoyaltyTransaction {
        String id PK
        String userId FK
        String orderId FK_NULL
        String programId FK
        Int pointsChange
        LoyaltyTransactionType transactionType
        String description NULL
        DateTime createdAt
    }

    Inventory {
        String id PK
        String menuItemId FK
        String variantId FK_NULL
        Int quantity
        Int reorderThreshold
        InventoryStatus status
        DateTime lastUpdated
        String supplierId FK_NULL
        String restaurantId FK
        String tenantId FK
        String location NULL
        UK(restaurantId, menuItemId, variantId)
    }

    Supplier {
        String id PK
        String name
        String email UK
        String phone NULL
        string address NULL
        Boolean isActive
        DateTime createdAt
        DateTime updatedAt
        String tenantId FK
    }

    HeroSlider {
        String id PK
        String title
        String description NULL
        String imageUrl
        Float price NULL
        String buttonText NULL
        String linkUrl NULL
        SliderLinkType linkType
        String linkTargetId FK_NULL
        Int displayOrder
        Boolean isActive
        DateTime startDate NULL
        DateTime endDate NULL
        DateTime createdAt
        DateTime updatedAt
        String tenantId FK_NULL
    }

    DealSection {
        String id PK
        String title
        String subtitle NULL
        Int timerDays NULL
        Int timerHours NULL
        Int timerMinutes NULL
        Boolean isActive
        DateTime startDate NULL
        DateTime endDate NULL
        DateTime createdAt
        DateTime updatedAt
        String tenantId FK_NULL
    }

    Banner {
        String id PK
        String title
        String subtitle NULL
        String imageUrl NULL
        String hurryText NULL
        String buttonText NULL
        String buttonLink NULL
        SliderLinkType linkType NULL
        String linkTargetId FK_NULL
        Boolean isActive
        DateTime startDate NULL
        DateTime endDate NULL
        DateTime createdAt
        DateTime updatedAt
        String tenantId FK_NULL
    }

    OfferBanner {
        String id PK
        String discount
        String image
        String title
        String subtitle
        String buttonText
        String buttonLink
        SliderLinkType linkType NULL
        String linkTargetId FK_NULL
        Boolean isActive
        DateTime startDate NULL
        DateTime endDate NULL
        DateTime createdAt
        DateTime updatedAt
        String tenantId FK_NULL
    }

    NewArrivalsSection {
        String id PK
        String title
        String subtitle NULL
        Boolean isActive
        DateTime createdAt
        DateTime updatedAt
        String tenantId FK_NULL
    }

    Tab {
        String id PK
        String name
        Int order
        String sectionId FK
        Boolean isActive
        DateTime createdAt
        DateTime updatedAt
        String tenantId FK_NULL
    }

    OfferSection {
        String id PK
        Boolean isActive
        DateTime createdAt
        DateTime updatedAt
        String tenantId FK_NULL
    }

    OfferSectionBanner {
        String id PK
        String title
        String buttonText
        String buttonLink
        String offerSectionId UK FK
        Boolean isActive
        DateTime createdAt
        DateTime updatedAt
        String tenantId FK_NULL
    }

    Slider {
        String id PK
        String title
        String offerSectionId FK
        Int displayOrder
        Boolean isActive
        DateTime createdAt
        DateTime updatedAt
        String tenantId FK_NULL
    }

    MenuItemsOnSliders {
        String menuItemId PK FK
        String sliderId PK FK
        DateTime assignedAt
        Int order NULL
    }

    Cart {
        String id PK
        String userId UK FK
        DateTime createdAt
        DateTime updatedAt
        String tenantId FK
    }

    CartItem {
        String id PK
        String cartId FK
        String menuItemId FK
        String variantId FK_NULL
        Int quantity
        DateTime addedAt
        UK(cartId, menuItemId, variantId)
    }

    BlogCategory {
        String id PK
        String name UK
        String slug UK
        String description NULL
        DateTime createdAt
        DateTime updatedAt
        String tenantId FK_NULL
    }

    BlogPost {
        String id PK
        String title
        String slug UK
        String content
        String excerpt NULL
        String imageUrl NULL
        BlogPostStatus status
        DateTime publishedAt NULL
        String authorId FK
        String categoryId FK_NULL
        Int views
        Boolean allowComments
        DateTime createdAt
        DateTime updatedAt
        String tenantId FK_NULL
    }

    BlogTag {
        String id PK
        String name UK
        String slug UK
        DateTime createdAt
        DateTime updatedAt
        String tenantId FK_NULL
    }

    BlogPostsOnTags {
        String postId PK FK
        String tagId PK FK
        DateTime assignedAt
    }

    BlogComment {
        String id PK
        String postId FK
        String authorId FK
        String content
        String parentId FK_NULL
        Boolean isApproved
        DateTime createdAt
        DateTime updatedAt
        String tenantId FK_NULL
    }

    AnalyticsEvent {
        String id PK
        String userId FK_NULL
        String eventType
        String sessionId FK_NULL
        string payload
        DateTime timestamp
        String tenantId FK
    }

    SearchQuery {
        String id PK
        String userId FK_NULL
        String query
        Int resultsCount
        string filters NULL
        String sessionId FK_NULL
        DateTime createdAt
        String tenantId FK
    }

    SupportTicket {
        String id PK
        String userId FK
        String orderId FK_NULL
        String subject
        String description
        SupportTicketStatus status
        PriorityLevel priority
        String assignedTo FK_NULL
        DateTime createdAt
        DateTime updatedAt
        DateTime resolvedAt NULL
        DateTime closedAt NULL
        String tenantId FK
    }

    SupportResponse {
        String id PK
        String ticketId FK
        String responderId FK
        String message
        Boolean isInternal
        string attachments NULL
        DateTime createdAt
    }

    Permission {
        String id PK
        String name UK
        String description NULL
        String category
        DateTime createdAt
        DateTime updatedAt
    }

    RolePermission {
        UserRole role PK
        String permissionId PK FK
        DateTime grantedAt
    }

    Session {
        String id PK
        String userId FK
        String token UK
        String refreshToken UK_NULL
        String ipAddress NULL
        string deviceInfo NULL
        DateTime expiresAt
        DateTime revokedAt NULL
        DateTime createdAt
    }

    // --- Relationships ---

    User ||--o{ Address : "addresses"
    User ||--o{ Wishlist : "wishlists"
    User ||--o{ UserAudit : "audits (UserAudits)"
    User ||--o{ UserAudit : "auditChanges (AuditChangers)"
    User ||--o{ Restaurant : "ownedRestaurants (UserRestaurants)"
    User ||--o{ Order : "orders"
    User ||--o{ Notification : "notifications"
    User ||--o{ LoyaltyTransaction : "loyaltyTransactions"
    User ||--o{ OrderCancellation : "cancellationRequests (CancellationRequests)"
    User ||--o{ OrderCancellation : "cancellationApprovals (CancellationApprovals)"
    User ||--o{ AnalyticsEvent : "analyticsEvents"
    User ||--o{ SearchQuery : "searchQueries"
    User ||--o{ Session : "sessions"
    User ||--o{ SupportTicket : "supportTickets (UserTickets)"
    User ||--o{ SupportResponse : "supportResponses (UserResponses)"
    User ||--o{ MenuItem : "menuItemUpdates (MenuItemUpdates)"
    User ||--o{ MenuItemReview : "menuItemReviews"
    User ||--o{ BlogComment : "blogComments (UserBlogComments)"
    User ||--o{ Feedback : "feedback (FeedbackUser)"
    User ||--o{ SupportTicket : "assignedSupportTickets (SupportAssignments)"
    User ||--o{ OrderAudit : "orderAudits"
    User ||--o{ Driver : "drivers"
    User ||--o{ BlogPost : "blogPosts (UserBlogPosts)"
    User ||--|| Cart : "cart"

    UserAudit }o--|| User : "user (UserAudits)"
    UserAudit }o--o| User : "changer (AuditChangers)"

    Address }o--|| User : "user"

    Wishlist }o--|| User : "user"
    Wishlist }o--|| MenuItem : "menuItem"

    Restaurant ||--o{ MenuItem : "menuItems"
    Restaurant ||--o{ Order : "orders"
    Restaurant ||--o{ TaxRate : "taxRates"
    Restaurant ||--o{ Menu : "menus"
    Restaurant ||--o{ Inventory : "inventory"
    Restaurant }o--|| User : "owner (UserRestaurants)"
    Restaurant }o--o| Brand : "brand"

    Brand ||--o{ Restaurant : "restaurants"
    Brand ||--o{ MenuItem : "menuItems"

    Category ||--o{ MenuItem : "menuItems"
    Category }o--o| Category : "parent (CategoryHierarchy)"
    Category ||--o{ Category : "children (CategoryHierarchy)"

    MenuItem ||--o{ MenuItemAudit : "audits (MenuItemAudits)"
    MenuItem ||--o{ MenuItemVariant : "variants"
    MenuItem ||--o{ MenuItemImage : "images"
    MenuItem ||--o{ MenuItemSpecification : "specifications"
    MenuItem ||--o{ MenuItemAttribute : "attributes (MenuItemAttributes)"
    MenuItem ||--o{ MenuItemPriceHistory : "priceHistory"
    MenuItem ||--o{ MenuItemReview : "reviews"
    MenuItem ||--o{ RelatedMenuItem : "relatedMenuItems (SourceRelatedItems)"
    MenuItem ||--o{ RelatedMenuItem : "relatedToItems (TargetRelatedItems)"
    MenuItem ||--o{ OrderItem : "orderItems"
    MenuItem ||--o{ Wishlist : "wishlists"
    MenuItem ||--o{ MenuItemRecommendation : "recommendations (SourceRecommendations)"
    MenuItem ||--o{ MenuItemRecommendation : "targetRecommendations (TargetRecommendations)"
    MenuItem ||--o{ MenuItemsOnMenus : "menus"
    MenuItem ||--o{ MenuItemsOnSliders : "sliders"
    MenuItem ||--o{ CartItem : "cartItems (CartItem_MenuItem)"
    MenuItem ||--o{ Inventory : "inventoryItems (menuItemRelation)"
    MenuItem ||--o{ MenuItemAllergen : "menuItemAllergens"
    MenuItem }o--|| Restaurant : "restaurant"
    MenuItem }o--|| Category : "category"
    MenuItem }o--|| User : "updatedByUser (MenuItemUpdates)"
    MenuItem }o--o| Brand : "brand"
    MenuItem }o--o| TaxRate : "taxRate"
    MenuItem }o--o| DealSection : "dealSection"
    MenuItem }o--o| NewArrivalsSection : "newArrivalsSection (SectionAllItems)"
    MenuItem }o--o| Tab : "tab (TabItems)"
    MenuItem -- Tag : "tags (MenuItemTags - M2M Implicit)"

    MenuItemAudit }o--|| MenuItem : "menuItem (MenuItemAudits)"

    MenuItemVariant ||--o{ Inventory : "inventory"
    MenuItemVariant ||--o{ MenuItemPriceHistory : "priceHistory"
    MenuItemVariant ||--o{ CartItem : "cartItems (CartItem_Variant)"
    MenuItemVariant }o--|| MenuItem : "menuItem"

    MenuItemImage }o--|| MenuItem : "menuItem"

    MenuItemSpecification }o--|| MenuItem : "menuItem"

    MenuItemAttribute }o--|| MenuItem : "menuItem (MenuItemAttributes)"

    MenuItemPriceHistory }o--|| MenuItem : "menuItem"
    MenuItemPriceHistory }o--o| MenuItemVariant : "variant"

    MenuItemReview }o--|| MenuItem : "menuItem"
    MenuItemReview }o--|| User : "user"

    RelatedMenuItem }o--|| MenuItem : "menuItem (SourceRelatedItems)"
    RelatedMenuItem }o--|| MenuItem : "relatedItem (TargetRelatedItems)"

    Menu ||--o{ MenuItemsOnMenus : "menuItems"
    Menu }o--|| Restaurant : "restaurant"

    MenuItemsOnMenus }o--|| MenuItem : "menuItem"
    MenuItemsOnMenus }o--|| Menu : "menu"

    MenuItemRecommendation }o--|| MenuItem : "sourceMenuItem (SourceRecommendations)"
    MenuItemRecommendation }o--|| MenuItem : "targetMenuItem (TargetRecommendations)"

    Order ||--o{ OrderItem : "items"
    Order ||--o{ OrderAudit : "audits"
    Order ||--o{ Feedback : "feedback"
    Order ||--o{ SupportTicket : "supportTickets"
    Order ||--o{ Payment : "payments"
    Order ||--o{ LoyaltyTransaction : "loyaltyTransactions"
    Order ||--|| Delivery : "delivery"
    Order ||--o{ OrderCancellation : "cancellations"
    Order }o--|| User : "user"
    Order }o--|| Restaurant : "restaurant"

    OrderItem }o--|| Order : "order"
    OrderItem }o--|| MenuItem : "menuItem"

    OrderAudit }o--|| Order : "order"
    OrderAudit }o--|| User : "changer"

    Payment }o--|| Order : "order"

    Delivery }o--|| Order : "order"
    Delivery }o--o| Driver : "driver"

    Driver ||--o{ Delivery : "deliveries"
    Driver }o--|| User : "user"

    OrderCancellation }o--|| Order : "order"
    OrderCancellation }o--|| User : "requester (CancellationRequests)"
    OrderCancellation }o--o| User : "approver (CancellationApprovals)"

    Allergen ||--o{ MenuItemAllergen : "menuItems"

    MenuItemAllergen }o--|| MenuItem : "menuItem"
    MenuItemAllergen }o--|| Allergen : "allergen"

    TaxRate ||--o{ MenuItem : "menuItems"
    TaxRate }o--o| Restaurant : "restaurant"

    Notification }o--|| User : "user"

    Feedback }o--|| Order : "order"
    Feedback }o--|| User : "user (FeedbackUser)"

    LoyaltyProgram ||--o{ LoyaltyTransaction : "transactions"

    LoyaltyTransaction }o--|| User : "user"
    LoyaltyTransaction }o--o| Order : "order"
    LoyaltyTransaction }o--|| LoyaltyProgram : "program"

    Inventory }o--|| MenuItem : "menuItem (menuItemRelation)"
    Inventory }o--o| MenuItemVariant : "variant"
    Inventory }o--o| Supplier : "supplier"
    Inventory }o--|| Restaurant : "restaurant"

    Supplier ||--o{ Inventory : "inventory"

    DealSection ||--o{ MenuItem : "menuItems"

    NewArrivalsSection ||--o{ Tab : "tabs"
    NewArrivalsSection ||--o{ MenuItem : "menuItems (SectionAllItems)"

    Tab ||--o{ MenuItem : "menuItems (TabItems)"
    Tab }o--|| NewArrivalsSection : "section"

    OfferSection ||--|| OfferSectionBanner : "banner"
    OfferSection ||--o{ Slider : "sliders"

    OfferSectionBanner }o--|| OfferSection : "offerSection"

    Slider ||--o{ MenuItemsOnSliders : "menuItems"
    Slider }o--|| OfferSection : "offerSection"

    MenuItemsOnSliders }o--|| MenuItem : "menuItem"
    MenuItemsOnSliders }o--|| Slider : "slider"

    Cart ||--o{ CartItem : "items"
    Cart }o--|| User : "user"

    CartItem }o--|| Cart : "cart"
    CartItem }o--|| MenuItem : "menuItem (CartItem_MenuItem)"
    CartItem }o--o| MenuItemVariant : "variant (CartItem_Variant)"

    BlogCategory ||--o{ BlogPost : "posts"

    BlogPost ||--o{ BlogComment : "comments"
    BlogPost ||--o{ BlogPostsOnTags : "tags"
    BlogPost }o--|| User : "author (UserBlogPosts)"
    BlogPost }o--o| BlogCategory : "category"

    BlogTag ||--o{ BlogPostsOnTags : "posts"

    BlogPostsOnTags }o--|| BlogPost : "post"
    BlogPostsOnTags }o--|| BlogTag : "tag"

    BlogComment ||--o{ BlogComment : "replies (CommentReplies)"
    BlogComment }o--|| BlogPost : "post"
    BlogComment }o--|| User : "author (UserBlogComments)"
    BlogComment }o--o| BlogComment : "parent (CommentReplies)"

    AnalyticsEvent }o--o| User : "user"
    AnalyticsEvent }o--o| Session : "session"

    SearchQuery }o--o| User : "user"
    SearchQuery }o--o| Session : "session"

    SupportTicket ||--o{ SupportResponse : "responses"
    SupportTicket }o--|| User : "user (UserTickets)"
    SupportTicket }o--o| Order : "order"
    SupportTicket }o--o| User : "assignee (SupportAssignments)"

    SupportResponse }o--|| SupportTicket : "ticket"
    SupportResponse }o--|| User : "responder (UserResponses)"

    Permission ||--o{ RolePermission : "rolePermissions"

    RolePermission }o--|| Permission : "permission"

    Session ||--o{ AnalyticsEvent : "analyticsEvents"
    Session ||--o{ SearchQuery : "searchQueries"
    Session }o--|| User : "user"

```
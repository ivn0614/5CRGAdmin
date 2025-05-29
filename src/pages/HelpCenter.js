  import React, { useState } from 'react';
  import Layout from '../components/Layout';

  const HelpCenterPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('getting-started');
    const [expandedArticle, setExpandedArticle] = useState(null);

    const helpCategories = [
      {
        id: 'getting-started',
        name: 'Getting Started',
        icon: '🚀',
        color: 'bg-blue-500',
        articles: [
          { id: 'gs-1', title: 'Dashboard Overview', excerpt: 'Learn about the main dashboard features and statistics.' },
          { id: 'gs-2', title: 'Creating Your First Event', excerpt: 'Step-by-step guide to creating and managing events.' },
          { id: 'gs-3', title: 'Managing Activities', excerpt: 'How to add and edit activities for your events.' }
        ]
      },
      {
        id: 'events-management',
        name: 'Events Management',
        icon: '📅',
        color: 'bg-green-500',
        articles: [
          { id: 'em-1', title: 'Event Settings', excerpt: 'Configure dates, locations, and event details.' },
        ]
      },
      {
        id: 'activities',
        name: 'Activities',
        icon: '🏆',
        color: 'bg-yellow-500',
        articles: [
          { id: 'act-1', title: 'Activity Types', excerpt: 'Different types of activities and their features.' },
        ]
      },
      {
        id: 'users',
        name: 'User Management',
        icon: '👥',
        color: 'bg-purple-500',
        articles: [
          { id: 'usr-1', title: 'User Roles and Permissions', excerpt: 'Understanding different user roles in the system.' },
          { id: 'usr-2', title: 'Adding New Administrators', excerpt: 'How to add and manage system administrators.' },
          { id: 'usr-3', title: 'Profile Settings', excerpt: 'Updating your profile and notification preferences.' }
        ]
      }
    ];

    const filteredCategories = helpCategories.map(category => {
      return {
        ...category,
        articles: category.articles.filter(article => 
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
        )
      };
    }).filter(category => category.articles.length > 0);

    const articleContent = {
      'usr-1':`
      # User Roles and Permissions

      The 5th CRG Admin System uses a role-based access control system to ensure users have appropriate permissions based on their responsibilities.

      ## Access Management Overview

      - **Access User Management** 👥 — Navigate to User Management via the sidebar menu
      - **View User Roles** 📋 — See all users and their assigned roles in the system
      - **Modify Permissions** 🔐 — Administrators can change user roles as needed
      - **Audit Actions** 📊 — Track user activities through the audit log system

      ## Available User Roles

      The system offers four distinct user roles with varying permission levels:

      ### Administrator 👑

      Administrators have complete access to all system functions:

      - **Full System Access** — Can access and modify all areas of the system
      - **User Management** — Can create, edit, and delete user accounts
      - **Role Assignment** — Can assign roles to other users (except Super Admin)
      - **Event Management** — Can create, edit, and delete all events
      - **Activity Management** — Can create, edit, and delete all activities
      - **System Configuration** — Can modify system settings and preferences

      ### Event Manager 📅

      Event Managers have focused permissions for event management:

      - **Event Creation** — Can create new events in the system
      - **Event Editing** — Can edit their own events and associated details
      - **Activity Management** — Can create and manage activities for their events
      - **Limited User View** — Can view user information but cannot modify accounts
      - **Reports Access** — Can generate and view reports for their events

      ### Content Editor ✏️

      Content Editors focus on activity documentation:

      - **Activity Creation** — Can create new activities for existing events
      - **Content Management** — Can upload and manage images for activities
      - **Limited Event Access** — Can view all events but cannot create or edit them
      - **No User Management** — Cannot access user management functions
      - **Basic Reporting** — Can view basic activity statistics and reports

      ### Viewer 👁️

      Viewers have read-only access to the system:

      - **View Events** — Can see all events and their details
      - **View Activities** — Can see all activities and their documentation
      - **No Creation Rights** — Cannot create or modify any content
      - **No User Management** — Cannot access user management functions
      - **Basic Reporting** — Can view but not generate reports

      ## Role Assignment Process

      Administrators control role assignments through the User Management section:

      1. **Access User Management** — Navigate via the sidebar menu
      2. **Select User** — Click on the user you wish to modify
      3. **Change Role** — Use the role dropdown to select the appropriate role
      4. **Save Changes** — Confirm the role change with the Save button
      5. **Automatic Notification** — User receives email notification of role change

      ## Permission Limitations

      Even Administrators have certain limitations:

      - **Super Admin Protection** — Cannot modify the Super Admin account
      - **Self-Demotion Prevention** — Cannot downgrade their own admin role
      - **Deletion Restrictions** — Cannot delete their own account
      - **Audit Immutability** — Cannot modify the system audit logs

      ## Best Practices for User Management

      - **Principle of Least Privilege** — Assign users the minimum permissions needed for their role
      - **Regular Audits** — Periodically review user roles and permissions
      - **Role Matching** — Ensure user roles align with job responsibilities
      - **Documentation** — Maintain records of role changes and justifications
      - **Training** — Provide users with training appropriate to their role

      ## Role Transition Process

      When changing a user's role:

      1. Inform the user about the upcoming change
      2. Schedule the role change during non-peak hours
      3. Update the role in the User Management section
      4. Verify the user's access has changed appropriately
      5. Follow up with the user to ensure smooth transition

      ## Security Considerations

      - **Password Policies** — All users must comply with system password requirements
      - **Session Management** — Automatic session timeout for security
      - **Access Logging** — All login attempts are recorded in system logs
      - **Role Separation** — Maintain separation of duties for critical functions
      - **Regular Reviews** — Conduct quarterly reviews of all user roles

      ## Troubleshooting Access Issues

      If a user reports access problems:

      - **Verify Role Assignment** — Check that the correct role is assigned
      - **Session Status** — Ensure the user has logged out and back in after role changes
      - **Cache Issues** — Clear browser cache if old permissions persist
      - **Permission Conflict** — Check for conflicting group memberships
      - **System Logs** — Review logs for potential permission errors
      `,
      'usr-2': `
      # Administrator Management Guide

      The 5th CRG Admin System allows designated administrators to create and manage user accounts with varying permission levels.

      ## Adding New Administrators 👑

      Administrators can grant administration privileges to other users through the User Management interface:

      - **Access User Management** 👥 — Navigate to User Management via the sidebar menu or Dashboard quick actions
      - **Create Administrator Account** 🔐 — Complete the administrator registration form
      - **Verify Access** 📋 — Confirm the new administrator has proper system access

      ## Administrator Creation Process

      Creating a new administrator requires careful consideration and proper authorization:

      1. **Access the User Management Page** — Navigate to the User Management section using the sidebar menu
      2. **Open the Creation Form** — The form appears at the top of the User Management page
      3. **Complete Required Information** — Fill in all mandatory fields for the new administrator

      ## Required Administrator Information

      When creating a new administrator account, the following information is required:

      - **Email Address** — The administrator's official email (will be used for login)
      - **Temporary Password** — Initial password that administrator must change at first login
      - **Full Name** — The administrator's complete name for identification
      - **User Type** — Must be set to "Admin" to grant administrative privileges
      - **Department** — The department the administrator belongs to (select from dropdown)

      ## Security Considerations 🔒

      When creating administrator accounts, follow these security best practices:

      - **Use Strong Passwords** — Initial passwords should meet complexity requirements
      - **Limit Admin Access** — Only grant admin privileges when absolutely necessary
      - **Document Admin Creation** — Record when and why admin accounts are created
      - **Regular Audits** — Periodically review the admin user list for unnecessary accounts
      - **Immediate Training** — Ensure new administrators understand their responsibilities

      ## Administrator Capabilities

      Users with administrator privileges can:

      - **Manage All Users** — Create, edit, and delete any user account
      - **Assign Roles** — Change user types between standard user and administrator
      - **Access All System Areas** — Navigate to restricted areas of the application
      - **View System Logs** — Access activity logs across the entire system
      - **Configure System Settings** — Modify global application settings

      ## Department Assignment

      Administrators should be assigned to the appropriate department:

      - **IDT** — For technical and development team administrators
      - **Operations** — For operational staff with administrative needs
      - **Logistics** — For logistics team members requiring administrative access
      - **Finance** — For financial staff requiring administrative permissions
      - **Group Commander** — For leadership team administrators

      ## New Administrator Onboarding

      After creating a new administrator account:

      1. **Notification** — Inform the new administrator their account has been created
      2. **Login Instructions** — Provide clear instructions for first-time login
      3. **Password Change** — Require the administrator to change their temporary password
      4. **Training Session** — Schedule a brief training on administrative responsibilities
      5. **Documentation** — Share administrative documentation and best practices

      ## Editing Administrator Accounts

      To modify existing administrator information:

      1. **Locate Administrator** — Find the administrator in the Users List table
      2. **Select Edit Option** — Click the edit (pencil) icon in the Actions column
      3. **Update Information** — Modify the necessary fields in the edit form
      4. **Save Changes** — Confirm updates by clicking the "Update User" button
      5. **Verification** — Confirm changes appear correctly in the Users List

      ## Removing Administrator Access

      To revoke administrator privileges:

      1. **Access User Account** — Locate and edit the administrator's account
      2. **Change User Type** — Switch the "User Type" dropdown from "Admin" to "User"
      3. **Save Changes** — Apply the updated permissions
      4. **Verification** — Confirm the user now appears with standard user privileges
      5. **Notification** — Inform the user of their permission change

      ## Password Management

      Administrator password policies:

      - **Regular Changes** — Administrators should update passwords every 90 days
      - **Complexity Requirements** — Passwords must include letters, numbers, and special characters
      - **No Sharing** — Administrator credentials must never be shared between users
      - **Secure Storage** — Passwords must be stored securely, never in plain text
      - **Login Monitoring** — Unusual login patterns trigger automatic notifications

      ## Best Practices for Administrator Management

      - **Principle of Least Privilege** — Only grant admin access when necessary
      - **Regular Reviews** — Periodically audit all administrator accounts
      - **Documentation** — Maintain records of all administrator account changes
      - **Separation of Duties** — Ensure no single administrator has excessive control
      - **Training Requirements** — All administrators must complete security training

      ## Troubleshooting Administrator Access

      If an administrator reports access problems:

      - **Verify Account Status** — Ensure the account is active and properly configured
      - **Check User Type** — Confirm "Admin" is selected in the User Type field
      - **Session Issues** — Clear browser cache and cookies if needed
      - **Browser Compatibility** — Verify the administrator is using a compatible browser
      - **Connection Problems** — Check network connectivity to the application server
      `,
      'usr-3': `
      # User Profile Management

        The 5th CRG Admin System restricts profile management to administrators only, ensuring centralized control of user information and permissions.

        ## Administrator-Only Profile Access 🔒

        Profile management in the 5th CRG Admin System follows a strict security protocol:

        - **Restricted Editing** — Only administrators can modify user profile information
        - **Centralized Management** 👥 — All user data changes must go through authorized administrators
        - **Permission Control** 🔐 — Administrators manage all permission changes and role assignments
        - **Change Tracking** 📊 — All profile modifications are logged in the system audit trail

        ## Accessing User Profiles

        Administrators can access and modify user profiles through these steps:

        1. **Navigate to User Management** — Access the User Management section from the sidebar menu
        2. **Locate the User** — Find the specific user in the Users List table
        3. **Open Edit Mode** — Click the edit (pencil) icon in the Actions column
        4. **Modify Profile Data** — Make necessary changes to the user's information
        5. **Save Changes** — Confirm modifications by clicking the "Update User" button

        ## Editable Profile Information

        Administrators can modify the following user profile elements:

        - **Full Name** — Update the user's display name as needed
        - **Department Assignment** — Change the user's department affiliation
        - **User Type** — Upgrade or downgrade between standard User and Admin roles
        - **Account Status** — Manage user access (via the deletion function)

        ## Department Management

        When reassigning users to different departments:

        - **Department Options** — Choose from IDT, Operations, Logistics, Finance, or Group Commander
        - **Access Implications** — Understand that department changes may affect user workflow
        - **Notification Requirements** — Inform users of their department changes
        - **Data Consistency** — Ensure user assignments align with organizational structure
        - **Documentation** — Record department changes for administrative purposes

        ## User Type Management

        Changing a user's type significantly impacts their system access:

        - **Standard to Admin** — Grants complete system access and user management capabilities
        - **Admin to Standard** — Restricts access to standard view-only operations
        - **Security Considerations** — Each admin user increases potential security exposure
        - **Authentication Requirements** — All role changes require administrator authentication
        - **Verification Process** — System confirms admin privileges before allowing role changes

        ## Self-Service Limitations

        Standard users face the following restrictions:

        - **No Self-Editing** — Users cannot modify their own profile information
        - **View-Only Access** — Users can only view their current profile details
        - **Admin Assistance Required** — All changes must be requested through administrators
        - **System Enforcement** — These restrictions are enforced at the application level
        - **Redirect Security** — Unauthorized access attempts are redirected to the Dashboard

        ## Profile Change Request Process

        When users need profile updates:

        1. **Request Submission** — User contacts an administrator with specific change request
        2. **Administrator Verification** — Admin confirms the legitimacy of the request
        3. **Change Implementation** — Administrator makes the requested changes
        4. **Change Confirmation** — System logs the modification with admin identification
        5. **User Notification** — Administrator informs user when changes are complete

        ## Password Management Policy

        While profile details require administrator intervention, password management follows different rules:

        - **Initial Password** — Administrators set the initial password during account creation
        - **Password Requirements** — System enforces strong password policies
        - **Password Visibility** — Passwords can be temporarily visible during creation for verification
        - **Secure Transmission** — All password data is securely encrypted during transmission
        - **Storage Security** — Passwords are securely hashed in the database

        ## Profile Data Privacy

        The system maintains privacy standards for user information:

        - **Limited Data Collection** — Only essential information is stored in user profiles
        - **Access Controls** — Profile data is accessible only to administrators
        - **Audit Logging** — All access to profile information is recorded
        - **Data Protection** — Profile information is secured against unauthorized access
        - **Compliance Standards** — Information handling follows organizational data policies

        ## Common Profile Management Tasks

        Administrators regularly perform these profile management functions:

        - **Name Corrections** — Fixing typographical errors in user names
        - **Department Transfers** — Moving users between organizational departments
        - **Role Adjustments** — Changing user permissions based on job responsibilities
        - **Account Deactivation** — Temporarily removing system access when needed
        - **Data Verification** — Ensuring profile information remains accurate and current

        ## Best Practices for Profile Management

        When managing user profiles, administrators should:

        - **Verify Identity** — Confirm user identity before making profile changes
        - **Document Changes** — Maintain records of significant profile modifications
        - **Regular Audits** — Review user profiles periodically for accuracy
        - **Consistent Naming** — Follow organizational standards for name formatting
        - **Prompt Response** — Address profile change requests in a timely manner
      `,
      'gs-1': `
        # Dashboard Overview
        
        The Dashboard is your command center for the 5th CRG Admin System, providing a real-time snapshot of all events, activities, and key statistics.

        ## Statistics Cards

        At the top of your Dashboard, you'll find four key statistics displayed in colorful cards:

        - **Total Events** 📅 — The number of events created in the system
        - **Upcoming Activities** 🏆 — Activities with end dates in the future
        - **Total Activities** 📋 — All activities across all events
        - **Site Visits** 📍 — Visitor traffic statistics

        ## Recent Events

        The Recent Events table displays your five most recently created events with:

        - **Event Title** — The name of your event
        - **Date** — The formatted date range (start to end)
        - **Status** — Current event status (Upcoming or Completed)
        - **Actions** — Quick access buttons:
          - 👁️ View event activities
          - 📝 Edit event details
          - 🗑️ Delete the event

        ### Working with Events
        
        Deleting an event will:
        - Remove the event from your database
        - Delete associated event logos from storage
        - Update your dashboard statistics automatically
        
        Always use the confirmation dialog to prevent accidental deletions.

        ## Quick Actions

        The Quick Actions section provides three shortcut buttons:

        - **Create New Event** 📅 — Start the event creation process
        - **Add New Activity** 🏆 — Create a new activity for an event
        - **Manage Users** 👥 — Access user management controls

        ## Data Refresh

        Your Dashboard data automatically refreshes when you:
        - First load the Dashboard page
        - Delete an event
        - Return to the Dashboard from other sections

        ## Navigation Tips

        - Use the sidebar menu to navigate between system sections
        - The dashboard is optimized for both desktop and mobile viewing
        - Statistics cards adapt to different screen sizes

        ## Troubleshooting

        If your dashboard isn't displaying the expected data:
        - Check your internet connection
        - Refresh the page
        - Verify that you have the correct permissions
        - Contact support if problems persist
      `,
      'gs-2': `
      # Creating Your First Event
      
      This guide walks you through the process of creating and managing events in the 5th CRG Admin System.

      ## Event Creation Process

      Events are the foundation of the 5th CRG system. Each event can contain multiple activities and has its own set of details.

      - **Access the Events Page** — Navigate to Events Management using the sidebar or the "Create New Event" quick action from the Dashboard
      - **Open the Creation Form** — Click the "+ Add New Event" button in the top-right corner
      - **Fill in the Required Details** — Complete all fields marked with an asterisk (*)

      ## Required Event Information

      - **Event Name** — The title that will appear throughout the system
      - **Event Theme** — The central topic or focus of your event
      - **Start Date** — When your event begins (use the date picker)
      - **End Date** — When your event concludes (use the date picker)
      - **Description** — Detailed information about your event's purpose and activities

      ## Event Logo (Optional)

      Upload a logo to make your event visually recognizable:

      - Click the file input field and select an image file
      - A preview will appear once selected
      - The system will store your logo in the cloud storage
      - Progress indicator will show upload status

      ## Saving Your Event

      After completing the form:
      - Click "Save Event" to create your new event
      - The system will automatically determine if the event is "Upcoming" or "Completed" based on the end date
      - Your new event will appear at the top of the Events List

      ## Managing Existing Events

      From the Events List table, you can:

      - **View Activities** — Click the 👁️ icon to see all activities for this event
      - **Edit Event** — Click the 📝 icon to modify event details
      - **Delete Event** — Click the 🗑️ icon to permanently remove the event and its logo

      ## Event Status

      Events are automatically assigned a status:
      - **Upcoming** — Events with end dates in the future
      - **Completed** — Events with end dates in the past

      ## Tips for Success

      - Use descriptive event names for easy identification
      - Set accurate date ranges to ensure proper status categorization
      - Add detailed descriptions to help users understand the event purpose
      - Choose recognizable logos that represent your event theme
      - Regularly review and update your events list to maintain accuracy
    `,
    'gs-3': `
      # Managing Activities

  This guide walks you through the process of creating and managing activities in the 5th CRG Admin System.

  ## Activity Management Overview

  Activities are components of events in the 5th CRG system. Each activity belongs to a specific event and has its own set of details and images.

  - **Access the Activities Page** — Navigate to Activities Management using the sidebar or from the Events page
  - **Filter Activities** — Use the event selector to view activities for a specific event
  - **Create New Activities** — Click the "+ Add New Activity" button in the top-right corner

  ## Creating a New Activity

  ### Step 1: Select an Event

  Before creating an activity, you must select the event it belongs to:
  - Choose from the dropdown list of existing events
  - The selected event's details will appear below the dropdown

  ### Step 2: Enter Activity Details

  Complete all required fields marked with an asterisk (*):

  - **Activity Name** — The title that will appear throughout the system
  - **Activity Theme** — The specific focus or topic of your activity
  - **Start Date** — When the activity begins (use the date picker)
  - **End Date** — When the activity concludes (use the date picker)
  - **Start Time** — The time when the activity begins
  - **End Time** — The time when the activity ends
  - **Description** — Detailed information about the activity's purpose and content

  ### Step 3: Add Activity Images (Optional)

  Upload pictures to visually document your activity:

  - Click the file input field and select one or more image files
  - Previews will appear once selected
  - You can remove images by clicking the "✕" button on each preview
  - The system will store your images in cloud storage
  - A progress indicator will show upload status

  ### Step 4: Save Your Activity

  After completing the form:
  - Click "Save Activity" to create your new activity
  - Your new activity will appear in the Activities List
  - If you need to cancel, click "Cancel" to clear the form

  ## Managing Existing Activities

  From the Activities List table, you can:

  - **View Activity Details** — Click the 👁️ icon to see complete information and all images
  - **Edit Activity** — Click the 📝 icon to modify activity details or images
  - **Delete Activity** — Click the 🗑️ icon to permanently remove the activity and its images

  ## Activity Details Modal

  When viewing an activity's details, a modal will display:
  - Complete activity information
  - All uploaded images with full-size viewing option
  - Event association
  - Date and time information

  ## Tips for Success

  - Always select the correct parent event before creating an activity
  - Use descriptive activity names for easy identification
  - Set accurate date and time ranges
  - Add detailed descriptions to help users understand the activity purpose
  - Upload clear, high-quality images to document the activity
  - Organize activities by filtering by event when managing many entries
  - Regularly review and update your activities to maintain accurate records

  ## Best Practices

  - Create activities immediately after they occur while details are fresh
  - Include multiple images to fully document each activity
  - Use consistent naming conventions for related activities
  - Ensure start and end dates align with the parent event dates
  - Provide comprehensive descriptions for historical reference
  `,
  'em-1' : `
  # Event Settings

  This guide walks you through the process of configuring event settings in the 5th CRG Admin System.

  ## Event Configuration Overview

  Events are the cornerstone of the 5th CRG system. Properly configuring event settings ensures all activities are organized correctly and information is displayed accurately throughout the platform.

  - **Access Event Settings** — Navigate to Events Management using the sidebar menu
  - **Create or Edit Events** — Use the "+ Add New Event" button or edit existing events
  - **Configure Complete Details** — Ensure all required information is properly set

  ## Creating a New Event

  ### Step 1: Access the Event Form

  - Click the "+ Add New Event" button in the top-right corner of the Events Management page
  - A form will appear with all required fields for event configuration

  ### Step 2: Configure Basic Event Details

  Complete all required fields marked with an asterisk (*):

  - **Event Name** — Choose a clear, descriptive title for your event
  - **Event Theme** — Define the central topic or focus of your event
  - **Description** — Provide detailed information about the event's purpose, audience, and goals

  ### Step 3: Set Event Dates

  Properly configured dates determine event status and timeline:

  - **Start Date** — Select the first day of your event using the date picker
  - **End Date** — Select the last day of your event using the date picker
  - The system automatically sets event status (Upcoming or Completed) based on these dates

  ### Step 4: Upload Event Logo (Optional)

  Add visual identity to your event:

  - Click the file input field and select an image file
  - A preview will appear once selected
  - The system will store your logo in cloud storage
  - A progress indicator will show upload status

  ### Step 5: Save Event Configuration

  After completing all settings:
  - Click "Save Event" to create your new event with all configured settings
  - Your event will appear in the Events List with its status automatically assigned
  - If you need to cancel, click "Cancel" to clear the form

  ## Managing Event Settings

  From the Events List table, you can modify settings for existing events:

  - **Edit Event Settings** — Click the 📝 icon to modify any event configuration
  - **View Activities** — Click the 👁️ icon to see all activities associated with this event
  - **Delete Event** — Click the 🗑️ icon to permanently remove the event and its logo

  ## Event Status System

  Events are automatically categorized based on end date:
  - **Upcoming** — Events with end dates in the future
  - **Completed** — Events with end dates in the past

  The status is visually indicated in the Events List with color-coded badges.

  ## Best Practices for Event Configuration

  - **Accurate Dates** — Set precise start and end dates to ensure proper status display
  - **Descriptive Names** — Use clear, specific event names for easy identification
  - **Comprehensive Descriptions** — Include all relevant details about the event
  - **Optimized Images** — Upload appropriately sized logos for best display quality
  - **Regular Reviews** — Periodically check and update event settings for accuracy

  ## Event Planning Timeline

  For optimal event management:
  1. Create event with preliminary settings 2-3 months before start date
  2. Update settings with finalized details 1 month before event
  3. Add activities as they are planned
  4. Review all settings 1 week before event begins
  5. Make post-event updates if necessary after completion

  ## Advanced Settings Tips

  - Keep event names consistent for recurring events (e.g., "Annual Conference 2025")
  - Use detailed themes to clearly differentiate similar events
  - Ensure start date is always before end date to avoid status errors
  - Consider using standardized logos for event series to maintain brand consistency
  - Regularly archive completed events to maintain system performance
  `,
  'act-1' : `
  # Activity Management

  This comprehensive guide walks you through the process of managing activities in the 5th CRG Admin System.

  ## Activity Management Overview

  Activities are essential components of events in the system. They provide structure and organization to your events, allowing participants to engage with specific content.

  - **Access Activities** — Navigate to Activities Management via the sidebar menu
  - **Create New Activities** — Use the "+ Add New Activity" button in the top-right corner
  - **Filter by Event** — Use the dropdown menu to view activities for specific events
  - **Detailed View** — Access comprehensive information with the view button

  ## Creating a New Activity

  ### Step 1: Select an Event

  Before creating an activity, you must associate it with an event:
  - Use the dropdown menu to select the parent event
  - The system will display the selected event's details for confirmation
  - All activities must belong to an existing event

  ### Step 2: Enter Activity Details

  Complete all required fields marked with an asterisk (*):

  - **Activity Name** — Choose a clear, descriptive title for your activity
  - **Activity Theme** — Define the central topic or focus of this specific activity
  - **Start Date** — Select the first day of your activity using the date picker
  - **End Date** — Select the last day of your activity using the date picker
  - **Start Time** — Set when the activity begins using the time selector
  - **End Time** — Set when the activity concludes using the time selector
  - **Description** — Provide detailed information about the activity's purpose

  ### Step 3: Upload Activity Pictures

  Document your activities with images:

  - Click the file input field and select one or more image files
  - Preview thumbnails will appear once images are selected
  - Remove unwanted images by clicking the "✕" button on each preview
  - Images are stored securely in cloud storage
  - A progress indicator shows upload status during saving

  ### Step 4: Save Your Activity

  After completing all required information:
  - Click "Save Activity" to create your new activity with all configured settings
  - Your activity will appear in the Activities List associated with its event
  - If you need to cancel, click "Cancel" to clear the form without saving

  ## Managing Existing Activities

  From the Activities List table, you can perform several actions:

  - **View Activity Details** — Click the 👁️ icon to see complete information and images
  - **Edit Activity** — Click the 📝 icon to modify any aspect of the activity
  - **Delete Activity** — Click the 🗑️ icon to permanently remove the activity

  ## Activity Detail View

  The detail modal provides comprehensive information:

  - **Basic Information** — Theme, associated event, dates, and times
  - **Description** — The full activity description with proper formatting
  - **Image Gallery** — Browse all uploaded pictures in an organized gallery
  - **Full-Size View** — Click any image to open it in full size

  ## Filtering Activities

  For efficient management of multiple activities:

  - **Event Filter** — Select a specific event from the dropdown menu
  - **All Events View** — Select "All Events" to see activities across the system
  - **URL Parameters** — Direct access to filtered activities via unique URLs

  ## Best Practices for Activity Management

  - **Consistent Association** — Always link activities to their correct parent event
  - **Accurate Timeline** — Set precise dates and times that fall within the event dates
  - **Descriptive Naming** — Use clear, specific activity names for easy identification
  - **Complete Documentation** — Include all relevant details in the description field
  - **Visual Documentation** — Upload clear, relevant pictures to document each activity

  ## Activity Planning Workflow

  For optimal activity management:
  1. Create the parent event before adding any activities
  2. Plan your activity schedule within the event's timeline
  3. Configure complete activity details with accurate information
  4. Upload quality images to document the activity
  5. Review all activities periodically to ensure accuracy

  ## Advanced Management Tips

  - Use consistent naming conventions for similar activities across different events
  - Include specific time information in descriptions for multi-day activities
  - Upload multiple pictures to fully document important activities
  - Review all uploaded pictures before saving to ensure quality and relevance
  - Regularly update activity details if schedules or content changes
  `,
  };

    const renderArticleContent = (articleId) => {
      // Enhanced markdown-like rendering with better styling
      const content = articleContent[articleId] || "Article content not found.";
      const sections = content.split('##').map((section, index) => {
        if (index === 0) {
          const titleAndContent = section.split('\n').filter(line => line.trim());
          const title = titleAndContent[0].replace('#', '').trim();
          const introContent = titleAndContent.slice(1).join('\n');
          
          return (
            <div key={index} className="mb-8">
              <h2 className="text-3xl font-bold text-blue-700 mb-4">{title}</h2>
              <p className="text-gray-700 leading-relaxed text-lg">{introContent}</p>
            </div>
          );
        }
        
        const [title, ...contentLines] = section.split('\n');
        return (
          <div key={index} className="mb-8">
            <h3 className="text-xl font-bold mb-4 text-blue-600 border-b border-blue-200 pb-2">{title.trim()}</h3>
            <div className="pl-2">
              {contentLines.map((line, i) => {
                if (!line.trim()) return null;
                
                const boldPattern = /\*\*(.*?)\*\*/g;
                const textWithBold = line.replace(boldPattern, '<strong class="font-semibold text-blue-900">$1</strong>');
                
                if (line.trim().startsWith('-')) {
                  const listContent = line.replace('-', '').trim();
                  const formattedListContent = listContent.replace(boldPattern, '<strong class="font-semibold text-blue-900">$1</strong>');
                  
                  return (
                    <div key={i} className="flex items-start mb-3 ml-2 group hover:bg-blue-50 p-2 rounded-md transition-colors duration-200">
                      <span className="text-blue-500 mr-2 text-lg">•</span>
                      <span className="text-gray-700" dangerouslySetInnerHTML={{ __html: formattedListContent }} />
                    </div>
                  );
                }
                
                if (line.trim().startsWith('###')) {
                  const headingText = line.replace('###', '').trim();
                  return <h4 key={i} className="font-semibold text-lg text-blue-800 mt-6 mb-3">{headingText}</h4>;
                }
                
                return (
                  <p key={i} className="mb-4 text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: textWithBold }} />
                );
              })}
            </div>
          </div>
        );
      });
      
      return <div className="prose max-w-none">{sections}</div>;
    };

    const featuredArticles = helpCategories.flatMap(category => 
      category.articles.slice(0, 1).map(article => ({
        ...article,
        category
      }))
    ).slice(0, 4);

    const getLightColor = (color) => {
      const colorMap = {
        'bg-blue-500': 'bg-blue-50',
        'bg-green-500': 'bg-green-50',
        'bg-yellow-500': 'bg-yellow-50',
        'bg-purple-500': 'bg-purple-50'
      };
      return colorMap[color] || 'bg-gray-50';
    };

    return (
      <Layout>
        <div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-700 p-10 rounded-2xl text-white shadow-xl">
          <h1 className="text-3xl font-bold mb-3">Help Center</h1>
          <p className="text-lg opacity-90">Find answers to common questions about the 5th CRG Admin System</p>
          
          <div className="mt-8 relative">
            <input
              type="text"
              placeholder="Search for help articles..."
              className="w-full px-6 py-4 rounded-lg border-0 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute right-4 top-4 text-gray-400 text-xl">🔍</span>
          </div>
        </div>

        {!searchQuery && !expandedArticle && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Popular Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredArticles.map((article) => (
                <div 
                  key={article.id}
                  className={`${getLightColor(article.category.color)} rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer`}
                  onClick={() => setExpandedArticle(article.id)}
                >
                  <div className={`${article.category.color} text-white rounded-full w-12 h-12 flex items-center justify-center text-xl mb-4`}>
                    {article.category.icon}
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-gray-800">{article.title}</h3>
                  <p className="text-gray-600 text-sm">{article.excerpt}</p>
                  <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                    Read more <span className="ml-1">→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/4">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-3">Help Topics</h2>
              <ul className="space-y-3">
                {helpCategories.map((category) => (
                  <li key={category.id}>
                    <button
                      onClick={() => {
                        setActiveCategory(category.id);
                        setExpandedArticle(null);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg flex items-center transition-all duration-200 ${
                        activeCategory === category.id 
                          ? `${getLightColor(category.color)} border-l-4 ${category.color.replace('bg-', 'border-')}`
                          : 'hover:bg-gray-50 border-l-4 border-transparent'
                      }`}
                    >
                      <span className={`${category.color} text-white p-2 rounded-lg mr-3 text-base`}>
                        {category.icon}
                      </span>
                      <span className={`${activeCategory === category.id ? 'font-medium' : ''} transition-all duration-200`}>
                        {category.name}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:w-3/4">
            {searchQuery ? (
              <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <span className="text-blue-500 mr-2">🔍</span> Search Results
                </h2>
                {filteredCategories.length > 0 ? (
                  filteredCategories.map(category => (
                    <div key={category.id} className="mb-8 last:mb-0">
                      <h3 className="text-xl font-semibold mb-4 flex items-center">
                        <span className={`${category.color} text-white p-2 rounded-lg mr-3 text-base`}>
                          {category.icon}
                        </span>
                        {category.name}
                      </h3>
                      <ul className="ml-10 space-y-4">
                        {category.articles.map(article => (
                          <li key={article.id} className="group">
                            <button
                              onClick={() => setExpandedArticle(article.id)}
                              className="text-blue-600 hover:text-blue-800 text-lg font-medium group-hover:text-blue-800 transition-colors duration-300 text-left"
                            >
                              {article.title}
                            </button>
                            <p className="text-gray-600 mt-1 group-hover:text-gray-800 transition-colors duration-300">{article.excerpt}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-14 bg-gray-50 rounded-xl">
                    <div className="text-5xl mb-4">🔍</div>
                    <p className="text-gray-500 mb-4 text-lg">No results found for "{searchQuery}"</p>
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      Clear search
                    </button>
                  </div>
                )}
              </div>
            ) : expandedArticle ? (
              <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
                <button 
                  onClick={() => setExpandedArticle(null)} 
                  className="text-blue-600 hover:text-blue-800 mb-6 flex items-center group transition-colors duration-300"
                >
                  <span className="mr-1 transform group-hover:-translate-x-1 transition-transform duration-300">←</span> Back to articles
                </button>
                
                {helpCategories.map(category => 
                  category.articles.filter(article => article.id === expandedArticle)
                ).flat().map(article => (
                  <div key={article.id} className="article-content">
                    {renderArticleContent(article.id)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <span className={`${helpCategories.find(c => c.id === activeCategory)?.color || 'bg-blue-500'} text-white p-2 rounded-lg mr-3 text-base`}>
                    {helpCategories.find(c => c.id === activeCategory)?.icon || '📄'}
                  </span>
                  {helpCategories.find(c => c.id === activeCategory)?.name || 'Articles'}
                </h2>
                
                <div className="space-y-6">
                  {helpCategories
                    .find(c => c.id === activeCategory)
                    ?.articles.map(article => (
                      <div 
                        key={article.id} 
                        className="border border-gray-100 rounded-xl p-6 hover:border-blue-200 hover:shadow-md transition-all duration-300 cursor-pointer"
                        onClick={() => setExpandedArticle(article.id)}
                      >
                        <h3 className="font-semibold text-xl mb-2 text-blue-700">{article.title}</h3>
                        <p className="text-gray-600 mb-4">{article.excerpt}</p>
                        <div className="flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors duration-300">
                          Read article <span className="ml-1 group-hover:ml-2 transition-all duration-300">→</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  };

  export default HelpCenterPage;
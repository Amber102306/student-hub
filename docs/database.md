## Entities and attributes

### 1. users (for login)

| Field | Type | Note |
| --- | --- | --- |
| \_id | ObjectId | primary key |
| email | String | unique |
| passwordHash | String | never store the plain password |
| role | String | `admin` or `student` |
| createdAt | Date |  |

### 2. students

| Field | Type | Note |
| --- | --- | --- |
| \_id | ObjectId | primary key |
| userId | ObjectId | links to users |
| studentNo | String | unique, like `2026-00123` |
| name | String |  |
| phone | String | optional |
| dob | Date | optional |
| course | String | like `BSIT - Web Development` |

### 3. teachers

| Field | Type | Note |
| --- | --- | --- |
| \_id | ObjectId | primary key |
| name | String |  |
| email | String | unique |
| department | String |  |

### 4. subjects

| Field | Type | Note |
| --- | --- | --- |
| \_id | ObjectId | primary key |
| code | String | unique, like `IT201` |
| name | String |  |
| units | Number | 1 to 6 |

### 5. classes (a subject offered in a section, with a schedule)

| Field | Type | Note |
| --- | --- | --- |
| \_id | ObjectId | primary key |
| subjectId | ObjectId | links to subjects |
| teacherId | ObjectId | links to teachers |
| section | String | like `BSIT-3A` |
| day | String | `Mon` to `Sat` |
| start | String | `HH:MM` |
| end | String | `HH:MM` |
| room | String |  |

### 6. registrations (a student signs up for a class)

| Field | Type | Note |
| --- | --- | --- |
| \_id | ObjectId | primary key |
| studentId | ObjectId | links to students |
| classId | ObjectId | links to classes |
| status | String | `pending`, `approved`, or `rejected` |
| createdAt | Date |  |

### 7. grades

| Field | Type | Note |
| --- | --- | --- |
| \_id | ObjectId | primary key |
| studentId | ObjectId | links to students |
| subjectId | ObjectId | links to subjects |
| midterm | Number | 1.00 to 5.00, optional |
| finals | Number | 1.00 to 5.00, optional |

## Relations

- **users to students:** one to one. A student account has one user login.
- **subjects to classes:** one to many. One subject can have many classes (sections).
- **teachers to classes:** one to many. One teacher can teach many classes.
- **students to registrations:** one to many.
- **classes to registrations:** one to many.
- **students and classes:** many to many. The `registrations` collection sits in the middle.
- **students to grades:** one to many.
- **subjects to grades:** one to many.

## Rules to enforce

### Unique indexes

- `users.email`
- `students.studentNo`
- `teachers.email`
- `subjects.code`
- `registrations` on (`studentId`, `classId`)
- `grades` on (`studentId`, `subjectId`)

### Delete rules

- Delete a student: also delete their user, registrations, and grades.
- Delete a subject: also delete its classes, registrations, and grades.
- Delete a class: also delete its registrations.
- Delete a teacher: blocked if they still have classes.

### Checks in the backend

- Class end time must be after start time.
- No overlap for the same teacher, room, or section.
- Student cannot register for overlapping classes, the same subject twice, or more than 24 units.

## Do not store these (compute them)

- Final rating = average of midterm and finals.
- Remarks (passed or failed).
- GWA.
- Units loaded.
- Schedule conflicts.

Storing them can make the data wrong when something changes.

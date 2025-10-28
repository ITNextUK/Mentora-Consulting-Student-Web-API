-- Migration: Add coursesOfInterest and locationInterests fields to Student table
-- Description: Adds two new JSONB columns to store student's course preferences and location interests

-- Connect to the database
-- \c mentora_consulting;

-- Add coursesOfInterest column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'mentora_ref' 
        AND table_name = 'ref_mas_student' 
        AND column_name = 'courses_of_interest'
    ) THEN
        ALTER TABLE mentora_ref.ref_mas_student 
        ADD COLUMN courses_of_interest JSONB DEFAULT '[]'::jsonb;
        
        COMMENT ON COLUMN mentora_ref.ref_mas_student.courses_of_interest 
        IS 'Array of courses student is interested in. Format: [{courseName, level, university}]';
    END IF;
END $$;

-- Add locationInterests column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'mentora_ref' 
        AND table_name = 'ref_mas_student' 
        AND column_name = 'location_interests'
    ) THEN
        ALTER TABLE mentora_ref.ref_mas_student 
        ADD COLUMN location_interests JSONB DEFAULT '[]'::jsonb;
        
        COMMENT ON COLUMN mentora_ref.ref_mas_student.location_interests 
        IS 'Array of UK locations student is interested in. Format: [string array of city names]';
    END IF;
END $$;

-- Update stored procedure: sp_ref_student_insert
CREATE OR REPLACE FUNCTION mentora_ref.sp_ref_student_insert(
    p_student_id VARCHAR(20),
    p_first_name VARCHAR(50),
    p_last_name VARCHAR(50),
    p_email VARCHAR(100),
    p_phone VARCHAR(20),
    p_nic VARCHAR(20),
    p_date_of_birth DATE,
    p_gender VARCHAR(10),
    p_address TEXT,
    p_city VARCHAR(100),
    p_country VARCHAR(100),
    p_profile_picture_path VARCHAR(500),
    p_degree VARCHAR(100),
    p_institution VARCHAR(200),
    p_graduation_year INTEGER,
    p_gpa DECIMAL(3,2),
    p_ielts_score DECIMAL(2,1),
    p_english_level VARCHAR(50),
    p_work_experience JSONB,
    p_skills JSONB,
    p_courses_of_interest JSONB,
    p_location_interests JSONB,
    p_github VARCHAR(255),
    p_linkedin VARCHAR(255),
    p_portfolio VARCHAR(255),
    p_cv_path VARCHAR(500),
    p_password_hash VARCHAR(255),
    p_status VARCHAR(20),
    p_created_by VARCHAR(20)
)
RETURNS TABLE(result TEXT) AS $$
BEGIN
    INSERT INTO mentora_ref.ref_mas_student (
        student_id, first_name, last_name, email, phone, nic,
        date_of_birth, gender, address, city, country, profile_picture_path,
        degree, institution, graduation_year, gpa, ielts_score, english_level,
        work_experience, skills, courses_of_interest, location_interests,
        github, linkedin, portfolio, cv_path,
        password_hash, status, created_by, created_date
    ) VALUES (
        p_student_id, p_first_name, p_last_name, p_email, p_phone, p_nic,
        p_date_of_birth, p_gender, p_address, p_city, p_country, p_profile_picture_path,
        p_degree, p_institution, p_graduation_year, p_gpa, p_ielts_score, p_english_level,
        p_work_experience, p_skills, p_courses_of_interest, p_location_interests,
        p_github, p_linkedin, p_portfolio, p_cv_path,
        p_password_hash, p_status, p_created_by, CURRENT_TIMESTAMP
    );
    
    RETURN QUERY SELECT 'Student created successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Update stored procedure: sp_ref_student_modify
CREATE OR REPLACE FUNCTION mentora_ref.sp_ref_student_modify(
    p_student_id VARCHAR(20),
    p_first_name VARCHAR(50),
    p_last_name VARCHAR(50),
    p_email VARCHAR(100),
    p_phone VARCHAR(20),
    p_nic VARCHAR(20),
    p_date_of_birth DATE,
    p_gender VARCHAR(10),
    p_address TEXT,
    p_city VARCHAR(100),
    p_country VARCHAR(100),
    p_profile_picture_path VARCHAR(500),
    p_degree VARCHAR(100),
    p_institution VARCHAR(200),
    p_graduation_year INTEGER,
    p_gpa DECIMAL(3,2),
    p_ielts_score DECIMAL(2,1),
    p_english_level VARCHAR(50),
    p_work_experience JSONB,
    p_skills JSONB,
    p_courses_of_interest JSONB,
    p_location_interests JSONB,
    p_github VARCHAR(255),
    p_linkedin VARCHAR(255),
    p_portfolio VARCHAR(255),
    p_cv_path VARCHAR(500),
    p_password_hash VARCHAR(255),
    p_status VARCHAR(20),
    p_modified_by VARCHAR(20)
)
RETURNS TABLE(result TEXT) AS $$
BEGIN
    UPDATE mentora_ref.ref_mas_student
    SET
        first_name = p_first_name,
        last_name = p_last_name,
        email = p_email,
        phone = p_phone,
        nic = p_nic,
        date_of_birth = p_date_of_birth,
        gender = p_gender,
        address = p_address,
        city = p_city,
        country = p_country,
        profile_picture_path = p_profile_picture_path,
        degree = p_degree,
        institution = p_institution,
        graduation_year = p_graduation_year,
        gpa = p_gpa,
        ielts_score = p_ielts_score,
        english_level = p_english_level,
        work_experience = p_work_experience,
        skills = p_skills,
        courses_of_interest = p_courses_of_interest,
        location_interests = p_location_interests,
        github = p_github,
        linkedin = p_linkedin,
        portfolio = p_portfolio,
        cv_path = p_cv_path,
        password_hash = p_password_hash,
        status = p_status,
        modified_by = p_modified_by,
        modified_date = CURRENT_TIMESTAMP
    WHERE student_id = p_student_id;
    
    RETURN QUERY SELECT 'Student updated successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Verify migration
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'mentora_ref'
AND table_name = 'ref_mas_student'
AND column_name IN ('courses_of_interest', 'location_interests')
ORDER BY column_name;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Added columns: courses_of_interest, location_interests';
    RAISE NOTICE 'Updated stored procedures: sp_ref_student_insert, sp_ref_student_modify';
END $$;

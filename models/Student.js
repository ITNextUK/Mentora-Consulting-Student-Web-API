const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Student = sequelize.define('Student', {
  studentId: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    allowNull: false,
    field: 'student_id'
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'first_name',
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'last_name',
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  nic: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'date_of_birth'
  },
  gender: {
    type: DataTypes.STRING(10),
    allowNull: true,
    validate: {
      isIn: [['Male', 'Female', 'Other', 'Prefer not to say']]
    }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  profilePicturePath: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'profile_picture_path'
  },
  degree: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  institution: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  graduationYear: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'graduation_year'
  },
  gpa: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 4.0
    }
  },
  ieltsScore: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true,
    field: 'ielts_score',
    validate: {
      min: 0,
      max: 9.0
    }
  },
  englishLevel: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'english_level',
    validate: {
      isIn: [['Native', 'Fluent', 'Advanced', 'Intermediate', 'Basic']]
    }
  },
  workExperience: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'work_experience'
  },
  skills: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'skills'
  },
  coursesOfInterest: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'courses_of_interest'
  },
  locationInterests: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    field: 'location_interests'
  },
  github: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  linkedin: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  portfolio: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  cvPath: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'cv_path'
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'Active',
    validate: {
      isIn: [['Active', 'Inactive', 'Pending', 'Suspended']]
    }
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash'
  },
  createdBy: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'created_by'
  },
  createdDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_date'
  },
  modifiedBy: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'modified_by'
  },
  modifiedDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'modified_date'
  }
}, {
  tableName: 'ref_mas_student',
  schema: 'mentora_ref',
  timestamps: false,
  hooks: {
    beforeCreate: (student) => {
      student.createdDate = new Date();
    },
    beforeUpdate: (student) => {
      student.modifiedDate = new Date();
    }
  }
});

// Instance methods
Student.prototype.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

Student.prototype.isActive = function() {
  return this.status === 'Active';
};

Student.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.passwordHash;
  return values;
};

// Static methods
Student.generateNextStudentId = async function() {
  try {
    const result = await sequelize.query(
      'SELECT mentora_ref.fn_get_next_student_id() as next_id',
      { type: sequelize.QueryTypes.SELECT }
    );
    return result[0].next_id;
  } catch (error) {
    throw new Error('Failed to generate student ID: ' + error.message);
  }
};

Student.searchStudents = async function(searchTerm) {
  try {
    const result = await sequelize.query(
      'SELECT * FROM mentora_ref.fn_search_students(:searchTerm)',
      {
        replacements: { searchTerm },
        type: sequelize.QueryTypes.SELECT
      }
    );
    return result;
  } catch (error) {
    throw new Error('Failed to search students: ' + error.message);
  }
};

Student.getAllActive = async function() {
  return await this.findAll({
    where: { status: 'Active' },
    order: [['createdDate', 'DESC']]
  });
};

module.exports = Student;

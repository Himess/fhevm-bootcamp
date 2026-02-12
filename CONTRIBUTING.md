# Contributing to FHEVM Bootcamp Curriculum

Thank you for your interest in improving the FHEVM Bootcamp Curriculum. Contributions of all kinds are welcome --- from fixing a typo in a lecture note to adding an entirely new exercise module.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Types of Contributions](#types-of-contributions)
- [Development Setup](#development-setup)
- [Submitting Changes](#submitting-changes)
- [Style Guidelines](#style-guidelines)
- [Review Process](#review-process)
- [Reporting Issues](#reporting-issues)

---

## Code of Conduct

This project follows a standard code of conduct. By participating, you agree to:

- Be respectful and constructive in all interactions.
- Welcome newcomers and help them get oriented.
- Focus on the work, not the person.
- Accept feedback gracefully and give it kindly.
- Report unacceptable behavior to the project maintainers.

---

## How to Contribute

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR-USERNAME/fhevm-bootcamp.git
cd fhevm-bootcamp
git remote add upstream https://github.com/ORIGINAL-ORG/fhevm-bootcamp.git
```

### 2. Create a Branch

```bash
git checkout -b feature/your-description
# or
git checkout -b fix/your-description
```

Use descriptive branch names:
- `feature/module-15-privacy-nft` -- new module or major feature
- `fix/module-07-typo-in-exercise` -- bug fix or correction
- `docs/update-gas-guide` -- documentation improvement
- `chore/update-dependencies` -- maintenance task

### 3. Make Your Changes

Follow the [Style Guidelines](#style-guidelines) below.

### 4. Test Your Changes

- Verify all Solidity code compiles: `npx hardhat compile`
- Run existing tests: `npx hardhat test`
- Check Markdown formatting renders correctly.
- If you added exercises, include solution files and verify they work.

### 5. Submit a Pull Request

Push your branch and open a pull request against the `main` branch.

---

## Types of Contributions

### Content Improvements

| Type | Description | Example |
|---|---|---|
| **Corrections** | Fix factual errors, typos, broken links | Fixing an incorrect gas cost in the Gas Guide |
| **Clarifications** | Improve explanations that are unclear | Rewriting a confusing paragraph about ACL |
| **Updates** | Reflect API or tooling changes | Updating code for a new fhEVM version |

### New Content

| Type | Description | Requirements |
|---|---|---|
| **Exercises** | New hands-on coding exercises | Must include problem statement, starter code, solution, and tests |
| **Examples** | New code examples | Must compile, follow style guide, include comments |
| **Quiz Questions** | New assessment questions | Must include answer key and explanation |
| **Modules** | Entirely new modules | Discuss in an issue first; follow module template |

### Infrastructure

| Type | Description |
|---|---|
| **Tooling** | Improvements to build scripts, test utilities, CI/CD |
| **Templates** | New or improved module/exercise templates |
| **Translations** | Translating content to other languages |

---

## Development Setup

### Prerequisites

- Node.js 20+
- npm 10+ or pnpm 9+
- Git 2.40+

### Installation

```bash
npm install
npx hardhat compile
```

### Project Structure

When adding or modifying content, follow the established directory structure:

```
modules/XX-module-name/
├── README.md              # Module overview, learning objectives, prerequisites
├── lecture/
│   ├── notes.md           # Detailed lecture notes
│   └── slides/            # Presentation slides (if applicable)
├── examples/
│   ├── ExampleContract.sol
│   └── ...
├── exercises/
│   ├── exercise-01/
│   │   ├── README.md      # Problem statement
│   │   ├── starter/       # Starter code for students
│   │   └── solution/      # Reference solution
│   └── ...
└── quiz/
    └── quiz.md            # Assessment questions with answer key
```

---

## Submitting Changes

### Pull Request Template

When opening a PR, include:

```markdown
## Description
[What does this PR do?]

## Type of Change
- [ ] Content correction / typo fix
- [ ] New content (exercise, example, module)
- [ ] Content update (API changes, version updates)
- [ ] Infrastructure / tooling
- [ ] Documentation improvement

## Module(s) Affected
[List which modules are changed, e.g., Module 07 - Encrypted ERC-20]

## Checklist
- [ ] All Solidity code compiles without errors
- [ ] Code follows the project style guidelines
- [ ] New exercises include starter code AND solutions
- [ ] Quiz questions include answer keys
- [ ] Markdown renders correctly
- [ ] Links are not broken
- [ ] I have tested the changes locally
```

### Commit Messages

Write clear, descriptive commit messages:

```
feat(module-07): add overflow handling exercise

Add a new exercise covering encrypted overflow detection
in ERC-20 transfer functions. Includes starter code,
solution, and three test cases.
```

Prefixes:
- `feat:` -- new feature or content
- `fix:` -- correction or bug fix
- `docs:` -- documentation only
- `chore:` -- maintenance, dependencies
- `refactor:` -- restructuring without changing behavior
- `test:` -- adding or fixing tests

---

## Style Guidelines

### Solidity Code

1. **Use the new FHEVM API** throughout all examples:
   - Library: `FHE` (not `TFHE`)
   - Import: `@fhevm/solidity/lib/FHE.sol`
   - Config: `ZamaEthereumConfig` from `@fhevm/solidity/config/ZamaConfig.sol`
   - External inputs: `externalEuint32` (not `einput`)
   - Conversion: `FHE.fromExternal(value, proof)` (not `TFHE.asEuint32(einput, proof)`)

2. **Solidity version**: Use `pragma solidity ^0.8.24;` unless there is a specific reason for a different version.

3. **Formatting**: Use consistent 4-space indentation. Follow standard Solidity style conventions.

4. **Comments**: Add NatSpec comments to all public/external functions. Use inline comments to explain FHE-specific logic.

```solidity
/// @notice Transfers encrypted tokens from sender to recipient.
/// @param to The recipient address.
/// @param encryptedAmount The encrypted transfer amount.
function transfer(address to, externalEuint32 encryptedAmount, bytes calldata proof) external {
    euint32 amount = FHE.fromExternal(encryptedAmount, proof);

    // Check balance >= amount (comparison on ciphertexts)
    ebool hasEnough = FHE.ge(balances[msg.sender], amount);

    // Conditionally update balances (no branching on encrypted values)
    balances[msg.sender] = FHE.select(hasEnough, FHE.sub(balances[msg.sender], amount), balances[msg.sender]);
    balances[to] = FHE.select(hasEnough, FHE.add(balances[to], amount), balances[to]);

    // Set ACL permissions
    FHE.allowThis(balances[msg.sender]);
    FHE.allow(balances[msg.sender], msg.sender);
    FHE.allowThis(balances[to]);
    FHE.allow(balances[to], to);
}
```

### Markdown

1. Use ATX-style headers (`#`, `##`, `###`).
2. Use fenced code blocks with language identifiers (` ```solidity `, ` ```bash `, ` ```javascript `).
3. Use tables for structured data.
4. Use relative links for internal references.
5. One sentence per line in source (for cleaner diffs).
6. Avoid emojis in instructional content.

### Exercises

1. Every exercise must have a clear problem statement.
2. Provide starter code that compiles but is incomplete.
3. Include a working solution.
4. Include at least one test case for the solution.
5. Difficulty should be clearly stated (Beginner / Intermediate / Advanced).
6. Estimated completion time should be realistic.

---

## Review Process

1. **Automated Checks**: PRs must pass CI (compilation, linting, link checks).
2. **Maintainer Review**: At least one maintainer will review within 5 business days.
3. **Feedback**: Reviewers may request changes. Address all comments before merging.
4. **Merge**: Maintainers merge approved PRs using squash-and-merge.

### What Reviewers Look For

- **Accuracy**: Is the technical content correct?
- **Clarity**: Will students understand this?
- **Completeness**: Are all required files present?
- **Consistency**: Does it follow the style guide and use the correct API?
- **Tested**: Does the code compile and work?

---

## Reporting Issues

Found a bug, inaccuracy, or have a suggestion? Open a GitHub issue with:

- **Title**: Clear, concise description
- **Description**: What is wrong or what you suggest
- **Location**: Which file/module is affected
- **Expected vs Actual**: What should be there vs what is there
- **Screenshots**: If applicable

Use issue labels:
- `bug` -- something is wrong
- `enhancement` -- improvement to existing content
- `new-content` -- request for new material
- `question` -- need clarification
- `good-first-issue` -- suitable for new contributors

---

## Questions?

If you are unsure about anything, open a discussion thread on GitHub or reach out to the maintainers. We are happy to help you get started.

Thank you for helping make FHE education accessible to everyone.

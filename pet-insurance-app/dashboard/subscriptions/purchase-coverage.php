<?php
/**
 * dashboard/subscriptions/purchase-coverage.php
 * User selects a plan and duration for their pet, then proceeds to Stripe checkout.
 */
require_once __DIR__ . '/../../config/constants.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/sanitize.php';
require_once __DIR__ . '/../../includes/csrf.php';
require_once __DIR__ . '/../../auth/middleware.php';

requireLogin();

/** @var PDO $db */

$userId = (int) ($_SESSION['user_id'] ?? 0);
$errors = [];

// ── Get pet_id from query string ─────────────────────────────
$petId = inputInt('pet_id', 'GET');

// Validate pet belongs to user
$pet = null;
if ($petId) {
    $stmt = $db->prepare('SELECT * FROM pets WHERE id = :id AND user_id = :uid LIMIT 1');
    $stmt->execute([':id' => $petId, ':uid' => $userId]);
    $pet = $stmt->fetch();
}

if (!$pet) {
    header('Location: /dashboard/my-pets.php');
    exit;
}

// Check if pet already has an active subscription
$stmt = $db->prepare('
    SELECT s.id FROM subscriptions s
    WHERE s.pet_id = :pid AND s.user_id = :uid AND s.status = :status
    LIMIT 1
');
$stmt->execute([':pid' => $petId, ':uid' => $userId, ':status' => 'active']);
if ($stmt->fetch()) {
    $_SESSION['flash_message'] = esc($pet['name']) . ' already has an active plan.';
    header('Location: /dashboard/my-pets.php');
    exit;
}

// Fetch available plans
$plans = $db->query("SELECT * FROM insurance_plans WHERE is_active = 1 ORDER BY monthly_premium ASC")->fetchAll();
if (empty($plans)) {
    $plans = [
        ['id' => 1, 'name' => 'Basic',    'monthly_premium' => '29.99', 'annual_limit' => '5000.00',  'deductible' => '100.00', 'coverage_pct' => '70.00', 'description' => 'Essential coverage for routine vet visits and minor treatments.'],
        ['id' => 2, 'name' => 'Premium',  'monthly_premium' => '49.99', 'annual_limit' => '15000.00', 'deductible' => '50.00',  'coverage_pct' => '80.00', 'description' => 'Comprehensive coverage including surgeries, diagnostics, and specialist referrals.'],
        ['id' => 3, 'name' => 'Ultimate', 'monthly_premium' => '79.99', 'annual_limit' => '50000.00', 'deductible' => '0.00',   'coverage_pct' => '90.00', 'description' => 'Full coverage with zero deductible, from routine checkups to emergency surgeries.'],
    ];
}

// Pre-select plan if passed via query string
$preselectedPlanId = inputInt('plan_id', 'GET');

// ── Handle POST — redirect to review-and-pay ─────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireValidCsrf();

    $chosenPlanId = inputInt('plan_id');

    if (!$chosenPlanId) {
        $errors['plan'] = 'Please select a plan.';
    } else {
        // Validate plan exists
        $valid = false;
        foreach ($plans as $p) {
            if ((int)$p['id'] === $chosenPlanId) { $valid = true; break; }
        }
        if (!$valid) $errors['plan'] = 'Invalid plan selected.';
    }

    if (!$errors) {
        // Redirect to teammate's Stripe review-and-pay page
        header('Location: /dashboard/subscriptions/review-and-pay.php?pet_id=' . $petId . '&plan_id=' . $chosenPlanId);
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Choose Coverage — PawShield</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="/assets/css/style.css">
    <link rel="stylesheet" href="/assets/css/accessibility.css">
</head>
<body>

<?php require_once __DIR__ . '/../../includes/navbar.php'; ?>

<main id="main-content">
<div class="container py-5" style="max-width: 900px;">

    <a href="/dashboard/my-pets.php" class="btn btn-outline-secondary btn-sm mb-4">
        <i class="bi bi-arrow-left me-1"></i> Back to My Pets
    </a>

    <h2 class="mb-2"><i class="bi bi-shield-check me-2"></i>Choose Coverage</h2>
    <p class="text-muted mb-4">
        Select a plan for <strong><?= esc($pet['name']) ?></strong>
        (<?= esc(ucfirst($pet['species'])) ?><?= $pet['breed'] ? ', ' . esc($pet['breed']) : '' ?>).
        You'll review payment details on the next page.
    </p>

    <?php if (!empty($errors)): ?>
        <div class="alert alert-danger">
            <?php foreach ($errors as $e): ?>
                <div><?= esc($e) ?></div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>

    <form method="POST" id="coverageForm">
        <?php csrfField(); ?>

        <!-- Plan selection cards -->
        <div class="row g-3 mb-4">
            <?php
            $planIcons = ['bi-shield', 'bi-shield-fill-check', 'bi-shield-fill-plus'];
            foreach ($plans as $i => $plan):
                $isSelected = ($preselectedPlanId && (int)$plan['id'] === $preselectedPlanId);
            ?>
            <div class="col-md-4">
                <div class="card h-100 plan-select-card <?= $isSelected ? 'border-primary shadow' : '' ?>"
                     style="cursor: pointer;"
                     onclick="selectPlan(<?= (int)$plan['id'] ?>, this)">
                    <div class="card-body text-center">
                        <i class="bi <?= $planIcons[$i] ?? 'bi-shield' ?> fs-2 text-primary mb-2 d-block"></i>
                        <h5 class="card-title"><?= esc($plan['name']) ?></h5>
                        <div class="mb-2">
                            <span class="fs-3 fw-bold">$<?= number_format((float)$plan['monthly_premium'], 2) ?></span>
                            <span class="text-muted">/mo</span>
                        </div>
                        <ul class="list-unstyled small text-start">
                            <li><i class="bi bi-check-circle-fill text-success me-1"></i>
                                Up to $<?= number_format((float)$plan['annual_limit']) ?> annual limit</li>
                            <li><i class="bi bi-check-circle-fill text-success me-1"></i>
                                <?= number_format((float)$plan['coverage_pct']) ?>% coverage</li>
                            <li><i class="bi bi-check-circle-fill text-success me-1"></i>
                                $<?= number_format((float)$plan['deductible']) ?> deductible</li>
                        </ul>
                        <p class="text-muted small mt-2 mb-0"><?= esc($plan['description']) ?></p>
                    </div>
                </div>
            </div>
            <?php endforeach; ?>
        </div>

        <input type="hidden" name="plan_id" id="selectedPlanId"
               value="<?= $preselectedPlanId ? (int)$preselectedPlanId : '' ?>">

        <button type="submit" class="btn btn-primary btn-lg w-100" id="proceedBtn"
                <?= !$preselectedPlanId ? 'disabled' : '' ?>>
            Proceed to Review & Pay <i class="bi bi-arrow-right ms-2"></i>
        </button>
    </form>

</div>
</main>

<?php require_once __DIR__ . '/../../includes/footer.php'; ?>

<script>
    function selectPlan(planId, cardEl) {
        document.getElementById('selectedPlanId').value = planId;
        document.getElementById('proceedBtn').disabled = false;

        document.querySelectorAll('.plan-select-card').forEach(c => {
            c.classList.remove('border-primary', 'shadow');
        });
        cardEl.classList.add('border-primary', 'shadow');
    }
</script>
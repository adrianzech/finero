<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Doctrine\Orm\Filter\BooleanFilter;
use ApiPlatform\Doctrine\Orm\Filter\OrderFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Enum\RecurringInterval;
use App\Repository\RecurringExpenseRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Serializer\Annotation\SerializedName;
use Symfony\Component\Validator\Constraints as Assert;

#[ApiResource(
    operations: [
        new GetCollection(),
        new Post(),
        new Get(),
        new Patch(),
        new Delete(),
    ],
    normalizationContext: ['groups' => ['recurring_expense:read']],
    denormalizationContext: ['groups' => ['recurring_expense:write']],
    paginationEnabled: true,
    paginationPartial: false,
    paginationType: 'page'
)]
#[ApiFilter(SearchFilter::class, properties: ['name' => 'ipartial', 'currency' => 'exact'])]
#[ApiFilter(OrderFilter::class, properties: ['name', 'amount', 'nextBillingDate', 'isActive'], arguments: ['orderParameterName' => 'order'])]
#[ApiFilter(BooleanFilter::class, properties: ['isActive'])]
#[ORM\Entity(repositoryClass: RecurringExpenseRepository::class)]
class RecurringExpense
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['recurring_expense:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 255)]
    #[Groups(['recurring_expense:read', 'recurring_expense:write'])]
    private ?string $name = null;

    #[ORM\Column(type: 'decimal', precision: 14, scale: 2)]
    #[Assert\NotBlank]
    #[Assert\Type('numeric')]
    #[Assert\PositiveOrZero]
    #[Groups(['recurring_expense:read', 'recurring_expense:write'])]
    private ?string $amount = null;

    #[ORM\Column(length: 3)]
    #[Assert\NotBlank]
    #[Assert\Currency]
    #[Groups(['recurring_expense:read', 'recurring_expense:write'])]
    private ?string $currency = null;

    #[ORM\Column(enumType: RecurringInterval::class)]
    #[Assert\NotBlank]
    #[Groups(['recurring_expense:read', 'recurring_expense:write'])]
    private ?RecurringInterval $interval = null;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Assert\NotNull]
    #[Groups(['recurring_expense:read', 'recurring_expense:write'])]
    private ?\DateTimeImmutable $nextBillingDate = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    #[Groups(['recurring_expense:read', 'recurring_expense:write'])]
    private ?RecurringCategory $category = null;

    #[ORM\Column]
    private bool $isActive = true;

    #[ORM\Column(length: 1024, nullable: true)]
    #[Assert\Length(max: 1024)]
    #[Groups(['recurring_expense:read', 'recurring_expense:write'])]
    private ?string $notes = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getAmount(): ?string
    {
        return $this->amount;
    }

    public function setAmount(string $amount): static
    {
        $this->amount = $amount;

        return $this;
    }

    public function getCurrency(): ?string
    {
        return $this->currency;
    }

    public function setCurrency(string $currency): static
    {
        $this->currency = strtoupper($currency);

        return $this;
    }

    public function getInterval(): ?RecurringInterval
    {
        return $this->interval;
    }

    public function setInterval(RecurringInterval $interval): static
    {
        $this->interval = $interval;

        return $this;
    }

    public function getNextBillingDate(): ?\DateTimeImmutable
    {
        if ($this->nextBillingDate === null || $this->interval === null) {
            return $this->nextBillingDate;
        }

        $today = new \DateTimeImmutable('today');
        $nextBillingDate = $this->nextBillingDate;

        while ($nextBillingDate < $today) {
            $nextBillingDate = $this->advanceBillingDate($nextBillingDate);
        }

        if ($nextBillingDate !== $this->nextBillingDate) {
            $this->nextBillingDate = $nextBillingDate;
        }

        return $nextBillingDate;
    }

    public function setNextBillingDate(\DateTimeImmutable $nextBillingDate): static
    {
        $this->nextBillingDate = $nextBillingDate;

        return $this;
    }

    public function getCategory(): ?RecurringCategory
    {
        return $this->category;
    }

    public function setCategory(?RecurringCategory $category): static
    {
        $this->category = $category;

        return $this;
    }

    #[Groups(['recurring_expense:read', 'recurring_expense:write'])]
    #[SerializedName('isActive')]
    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): static
    {
        $this->isActive = $isActive;

        return $this;
    }

    public function getNotes(): ?string
    {
        return $this->notes;
    }

    public function setNotes(?string $notes): static
    {
        $this->notes = $notes;

        return $this;
    }

    private function advanceBillingDate(\DateTimeImmutable $billingDate): \DateTimeImmutable
    {
        return match ($this->interval) {
            RecurringInterval::WEEKLY => $billingDate->modify('+1 week'),
            RecurringInterval::MONTHLY => $billingDate->modify('+1 month'),
            RecurringInterval::QUARTERLY => $billingDate->modify('+3 months'),
            RecurringInterval::YEARLY => $billingDate->modify('+1 year'),
            default => $billingDate,
        };
    }
}

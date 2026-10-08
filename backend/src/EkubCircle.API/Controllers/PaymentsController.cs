using System.Security.Claims;
using AutoMapper;
using EkubCircle.Application.Commands.Payments;
using EkubCircle.Application.Queries.Payments;
using EkubCircle.Application.DTOs.Payments;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EkubCircle.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly ISender _sender;
    private readonly IMapper _mapper;

    public PaymentsController(ISender sender, IMapper mapper)
    {
        _sender = sender;
        _mapper = mapper;
    }

    private int GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.Parse(claim!);
    }

    /// <summary>
    /// Record a member contribution payment for a round (Organizer/Admin only).
    /// Prevents duplicate contributions for the same round.
    /// </summary>
    [HttpPost]
    [HttpPost("/api/rounds/{roundId:int}/payments")]
    [ProducesResponseType(typeof(PaymentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RecordPayment([FromBody] RecordPaymentRequestDto request, int? roundId = null)
    {
        var effectiveRoundId = roundId.HasValue && roundId.Value > 0 ? roundId.Value : request.RoundId;
        var effectiveMemberId = request.EffectiveMemberId;

        if (effectiveRoundId <= 0 || effectiveMemberId <= 0 || request.Amount <= 0)
        {
            return BadRequest(new { message = "RoundId, MemberId, and a positive Amount are required." });
        }

        try
        {
            var userId = GetCurrentUserId();
            var command = new RecordPaymentCommand(
                userId,
                effectiveRoundId,
                effectiveMemberId,
                request.Amount,
                request.PaymentMethod,
                request.Notes
            );
            var payment = await _sender.Send(command);
            return StatusCode(StatusCodes.Status201Created, payment);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get payment audit history filtered by circleId or roundId
    /// </summary>
    [HttpGet]
    [HttpGet("/api/circles/{circleId:int}/history")]
    [HttpGet("/api/history")]
    [ProducesResponseType(typeof(List<PaymentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPayments(int? circleId, [FromQuery] int? roundId)
    {
        var userId = GetCurrentUserId();
        var query = new GetPaymentsQuery(circleId, roundId, userId);
        var payments = await _sender.Send(query);
        return Ok(payments);
    }
}

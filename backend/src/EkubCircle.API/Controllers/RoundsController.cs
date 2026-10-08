using System.Security.Claims;
using AutoMapper;
using EkubCircle.Application.Commands.Rounds;
using EkubCircle.Application.Queries.Rounds;
using EkubCircle.Application.DTOs.Rounds;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EkubCircle.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class RoundsController : ControllerBase
{
    private readonly ISender _sender;
    private readonly IMapper _mapper;

    public RoundsController(ISender sender, IMapper mapper)
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
    /// Get the current active round for a circle, including member payment statuses and pot calculation
    /// </summary>
    [HttpGet("current")]
    [HttpGet("/api/circles/{circleId:int}/rounds/current")]
    [ProducesResponseType(typeof(CurrentRoundDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCurrentRound(
        [FromRoute(Name = "circleId")] int? routeCircleId,
        [FromQuery(Name = "circleId")] int? queryCircleId)
    {
        var circleId = (routeCircleId.HasValue && routeCircleId.Value > 0)
            ? routeCircleId.Value
            : (queryCircleId ?? 0);

        if (circleId <= 0)
        {
            return BadRequest(new { message = "Valid circleId is required." });
        }

        try
        {
            var userId = GetCurrentUserId();
            var query = new GetCurrentRoundQuery(circleId, userId);
            var currentRound = await _sender.Send(query);
            return Ok(currentRound);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get all rounds and their statuses for a circle
    /// </summary>
    [HttpGet]
    [HttpGet("/api/circles/{circleId:int}/rounds")]
    [ProducesResponseType(typeof(List<RoundSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCircleRounds(
        [FromRoute(Name = "circleId")] int? routeCircleId,
        [FromQuery(Name = "circleId")] int? queryCircleId)
    {
        var circleId = (routeCircleId.HasValue && routeCircleId.Value > 0)
            ? routeCircleId.Value
            : (queryCircleId ?? 0);

        if (circleId <= 0)
        {
            return BadRequest(new { message = "Valid circleId is required." });
        }

        try
        {
            var userId = GetCurrentUserId();
            var query = new GetCircleRoundsQuery(circleId, userId);
            var rounds = await _sender.Send(query);
            return Ok(rounds);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Execute pot payout for an open round.
    /// Strictly enforces: 100% member contribution, single pot receipt rule, organizer authority, and auto-advancement.
    /// </summary>
    [HttpPost("{roundId:int}/payout")]
    [ProducesResponseType(typeof(PayoutResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExecutePayout(int roundId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var command = new ExecutePayoutCommand(roundId, userId);
            var result = await _sender.Send(command);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Extra Credit: Server-side cryptographically fair draw for winner among eligible unpaid recipients.
    /// </summary>
    [HttpPost("{roundId:int}/draw")]
    [ProducesResponseType(typeof(DrawWinnerDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DrawWinner(int roundId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var command = new DrawRoundWinnerCommand(roundId, userId);
            var result = await _sender.Send(command);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

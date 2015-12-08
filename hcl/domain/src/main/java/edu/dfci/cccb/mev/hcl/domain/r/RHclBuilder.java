package edu.dfci.cccb.mev.hcl.domain.r;

import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;
import edu.dfci.cccb.mev.dataset.domain.contract.Dimension;
import edu.dfci.cccb.mev.dataset.domain.r.AbstractDispatchedRAnalysisBuilder;
import edu.dfci.cccb.mev.dataset.domain.r.annotation.Callback;
import edu.dfci.cccb.mev.dataset.domain.r.annotation.Callback.CallbackType;
import edu.dfci.cccb.mev.dataset.domain.r.annotation.Error;
import edu.dfci.cccb.mev.dataset.domain.r.annotation.Parameter;
import edu.dfci.cccb.mev.dataset.domain.r.annotation.R;
import edu.dfci.cccb.mev.dataset.domain.r.annotation.Result;
import edu.dfci.cccb.mev.hcl.domain.contract.Hcl;
import edu.dfci.cccb.mev.hcl.domain.contract.HclBuilder;
import edu.dfci.cccb.mev.hcl.domain.contract.Node;
import edu.dfci.cccb.mev.hcl.domain.simple.SimpleHcl;

@R ("function (dataset, metric, linkage) {"
    + "hc2n <- function (hc, flat = FALSE) {\n"
    + "  dist <- 0;\n"
    + "  if (is.null (hc$labels)) labels <- seq(along = hc$order) else labels <- hc$labels;\n"
    + "  putparenthesis <- function (i) {\n"
    + "    j <- hc$merge[i, 1];\n"
    + "    k <- hc$merge[i, 2];\n"
    + "    if (j < 0) {\n"
    + "      left <- labels[-j];\n"
    + "      if (k > 0) dist <- hc$height[i] - hc$height[k] else dist <- hc$height[i];\n"
    + "    } else left <- putparenthesis(j);\n"
    + "    if (k < 0) {\n"
    + "      right <- labels[-k];\n"
    + "      if (j > 0) dist <- hc$height[i] - hc$height[j] else dist <- hc$height[i];\n"
    + "    } else right <- putparenthesis(k);\n"
    + "    if (flat) return (paste (\"(\", left, \":\", dist/2, \",\", right, \":\", dist/2, \")\", sep = \"\"))\n"
    + "    else return (list(left = left, right = right, dist = dist));\n"
    + "  }\n"
    + "  n <- putparenthesis (nrow (hc$merge));\n"
    + "  if (flat) n <- paste(n, \";\", sep = \"\");\n"
    + "  return (n);\n"
    + "};\n"
    + "l <- function (n)"
    + "  if (typeof (n) == 'character') list (name = n) "
    + "  else list (distance = n$dist, left = l (n$left), right = l (n$right));"
    + "l (hc2n (stats::hclust (cluster::daisy (t (dataset), m = metric), method = linkage)));" +
    "}")
@Accessors (fluent = true, chain = true)
public class RHclBuilder extends AbstractDispatchedRAnalysisBuilder<HclBuilder, Hcl> implements HclBuilder {

  public RHclBuilder () {
    super ("Hierarchical Clustering");
  }

  private @Getter @Setter Dimension dimension;
  private @Getter @Setter @Parameter String metric;
  private @Getter @Setter @Parameter String linkage;
  private @Result Node root;
  private @Getter Hcl result;
  private @Getter @Error String error;

  @Callback (CallbackType.SUCCESS)
  private void formatResult () {
    result = new SimpleHcl ().dataset (dataset ()).dimension (dimension).name (name ()).type (type ()).root (root);
  }
}
